import crypto from 'crypto';
import { db } from '../../db/database.js';
import { EvidenceGroundedHealthSummarySchema } from '../../schemas/healthSummarySchema.js';
import { evaluateBiomarkerStatus } from './statusEngine.js';
import { findTestKnowledge } from '../../data/multilingualKnowledgeBase.js';
import { validateAiSummaryOutput } from './aiValidator.js';
import { STATUS_ORDER } from '../../config/statusConfig.js';

export class HealthSummaryService {
  static SUMMARY_VERSION = 2;

  /**
   * Generates a SHA-256 data hash of the report's clinical findings to detect modifications
   */
  static computeFindingsHash(report) {
    const rawAnalysis = typeof report.ai_analysis_json === 'string'
      ? JSON.parse(report.ai_analysis_json)
      : (report.ai_analysis_json || {});

    const findings = [
      rawAnalysis.labResults || [],
      rawAnalysis.medications || [],
      rawAnalysis.imagingFindings || [],
      rawAnalysis.explicitDiagnoses || [],
      report.report_date || report.reportDate || '',
      report.category || '',
      this.SUMMARY_VERSION
    ];

    return crypto.createHash('sha256').update(JSON.stringify(findings)).digest('hex');
  }

  /**
   * Retrieves summary from database or generates fresh summary
   */
  static async getOrGenerateSummary({ userId, reportId, language = 'en', forceRegenerate = false }) {
    if (!userId || !reportId) {
      throw new Error('User ID and Report ID are required.');
    }

    const validLangs = ['en', 'te', 'hi'];
    const selectedLang = validLangs.includes(language) ? language : 'en';

    // 1. Authorization & Report Lookup
    const report = db.prepare(`
      SELECT r.*, v.visit_date as visitDate, h.name as hospitalName
      FROM medical_reports r
      LEFT JOIN hospital_visits v ON v.id = r.visit_id
      LEFT JOIN hospitals h ON h.id = v.hospital_id
      WHERE r.id = ? AND r.user_id = ?
    `).get(reportId, userId);

    if (!report) {
      const error = new Error('Report not found or unauthorized.');
      error.status = 404;
      error.code = 'REPORT_NOT_FOUND';
      throw error;
    }

    const currentDataHash = this.computeFindingsHash(report);

    // 2. Check cached summary in report_health_summaries table (Instant Load)
    if (!forceRegenerate) {
      const cached = db.prepare(`
        SELECT * FROM report_health_summaries
        WHERE report_id = ? AND user_id = ? AND language = ?
      `).get(reportId, userId, selectedLang);

      if (cached && cached.data_hash === currentDataHash) {
        try {
          const parsed = JSON.parse(cached.summary_json);
          return EvidenceGroundedHealthSummarySchema.parse(parsed);
        } catch (e) {
          console.warn('[HealthSummaryService] Cached summary parse failed, regenerating:', e.message);
        }
      }
    }

    // 3. Generate Fresh Grounded Summary
    let summary;
    try {
      summary = await this.synthesizeGroundedSummary({
        userId,
        report,
        language: selectedLang,
        dataHash: currentDataHash
      });
    } catch (err) {
      console.warn('[HealthSummaryService] Synthesis error, falling back to deterministic template:', err.message);
      summary = this.generateFallbackTemplateSummary({
        report,
        language: selectedLang,
        dataHash: currentDataHash
      });
    }

    // 4. Validate output strictly against schema
    const validatedSummary = EvidenceGroundedHealthSummarySchema.parse(summary);

    // 5. Persist to report_health_summaries table with version
    const now = new Date().toISOString();
    const summaryId = `sum-${crypto.randomUUID()}`;

    db.prepare(`
      INSERT INTO report_health_summaries (
        id, report_id, user_id, language, summary_json, data_hash, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(report_id, language) DO UPDATE SET
        summary_json = excluded.summary_json,
        data_hash = excluded.data_hash,
        version = excluded.version,
        updated_at = excluded.updated_at
    `).run(
      summaryId,
      reportId,
      userId,
      selectedLang,
      JSON.stringify(validatedSummary),
      currentDataHash,
      this.SUMMARY_VERSION,
      now,
      now
    );

    // Update primary ai_summary in medical_reports if English
    if (selectedLang === 'en' && validatedSummary.overview) {
      db.prepare(`
        UPDATE medical_reports SET ai_summary = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(validatedSummary.overview, now, reportId, userId);
    }

    return validatedSummary;
  }

  /**
   * Synthesizes a deterministic evidence-grounded summary adhering to clinical safety rules
   */
  static async synthesizeGroundedSummary({ userId, report, language, dataHash }) {
    const rawAnalysis = typeof report.ai_analysis_json === 'string'
      ? JSON.parse(report.ai_analysis_json)
      : (report.ai_analysis_json || {});

    const labResults = rawAnalysis.labResults || [];
    const reportDate = report.report_date || report.reportDate || 'Unknown Date';
    const reportTitle = report.title || report.file_name || 'Medical Report';

    const outsideRangeCards = [];
    const allResults = [];
    const legacyWithin = [];
    const legacyOutside = [];
    const legacyFlagged = [];
    const legacyUncertainties = [];

    const areaGroupsMap = new Map();

    for (const lr of labResults) {
      const rawName = lr.name || 'Unspecified Test';
      const rawVal = lr.rawValue || (lr.numericValue != null ? String(lr.numericValue) : 'N/A');
      const unit = lr.unit || null;
      const rawRange = lr.referenceRange?.rawRange || (
        lr.referenceRange?.low != null && lr.referenceRange?.high != null
          ? `${lr.referenceRange.low} - ${lr.referenceRange.high}`
          : 'Unavailable'
      );

      // Step 3: Pure deterministic evaluation against report's own range
      const statusResult = evaluateBiomarkerStatus({
        value: rawVal,
        referenceRange: rawRange,
        unit
      });

      // Step 4: Knowledge base lookup in three languages
      const kbEntry = findTestKnowledge(rawName);
      let localized = null;
      let areaKey = 'other';
      let isUnknown = false;
      let aiGeneralInfo = null;

      if (kbEntry) {
        localized = kbEntry[language] || kbEntry.en;
        areaKey = kbEntry.area || 'other';
      } else {
        // Unknown test: Log to missing_knowledge table (Step 5 #3)
        isUnknown = true;
        this.logMissingKnowledge({
          testName: rawName,
          rawValue: rawVal,
          referenceRange: rawRange,
          reportId: report.id,
          userId
        });

        localized = {
          display_name: rawName,
          plain_meaning: language === 'te'
            ? 'ఈ పరీక్ష గురించి మీ వైద్యుడిని అడగండి.'
            : language === 'hi'
            ? 'इस परीक्षण के बारे में अपने डॉक्टर से पूछें।'
            : 'Ask your doctor about this test.',
          common_reasons_low: [],
          common_reasons_high: [],
          questions_for_doctor: [
            language === 'te' ? 'ఈ పరీక్ష ఫలితం నా ఆరోగ్యానికి ఏం సూచిస్తుంది?' : language === 'hi' ? 'यह परीक्षण परिणाम क्या दर्शाता है?' : 'What does this test result indicate for my health?'
          ]
        };

        aiGeneralInfo = language === 'te'
          ? 'ల్యాబ్ కొలత (AI ద్వారా రూపొందించబడిన సాధారణ సమాచారం).'
          : language === 'hi'
          ? 'प्रयोगशाला माप (एआई-जनरेटेड सामान्य जानकारी)।'
          : 'Laboratory parameter measurement (AI-generated general information).';
      }

      const displayName = localized.display_name;
      const plainMeaning = localized.plain_meaning;

      // Group common reasons by direction (NO causes for unknown tests)
      let commonReasons = [];
      if (!isUnknown) {
        if (statusResult.direction === 'HIGHER') {
          commonReasons = localized.common_reasons_high || [];
        } else if (statusResult.direction === 'LOWER') {
          commonReasons = localized.common_reasons_low || [];
        }
      }

      // Questions to ask doctor (2-3)
      const questionsForDoctor = localized.questions_for_doctor ? localized.questions_for_doctor.slice(0, 3) : [];

      // Step 5 #2: Code-built sentence for what the result shows
      const whatResultShows = this.buildResultSentence({
        displayName,
        value: rawVal,
        unit,
        labRange: rawRange,
        status: statusResult.status,
        direction: statusResult.direction,
        language
      });

      // Far outside urgent doctor notice
      let urgentDoctorNotice = null;
      if (statusResult.status === 'far_outside') {
        urgentDoctorNotice = language === 'te'
          ? 'దయచేసి ఈ ఫలితం గురించి వీలైనంత త్వరగా మీ వైద్యుడితో మాట్లాడండి.'
          : language === 'hi'
          ? 'कृपया इस परिणाम के बारे में जल्द ही अपने डॉक्टर से बात करें।'
          : 'Please talk to your doctor soon about this result.';
      }

      // Add to allResults row
      allResults.push({
        testName: rawName,
        displayName,
        value: rawVal,
        unit,
        labRange: rawRange,
        status: statusResult.status,
        arrow: statusResult.arrow,
        plainMeaning,
        area: areaKey
      });

      // Add to outsideRangeCards if outside or needs_review
      if (statusResult.status !== 'in_range') {
        outsideRangeCards.push({
          testName: rawName,
          displayName,
          value: rawVal,
          unit,
          labRange: rawRange,
          status: statusResult.status,
          direction: statusResult.direction,
          arrow: statusResult.arrow,
          severityLabel: this.getLocalizedSeverity(statusResult.status, language),
          sourceReport: reportTitle,
          reportDate,
          whatIsThisTest: plainMeaning,
          whatResultShows,
          commonReasons,
          questionsForDoctor,
          urgentDoctorNotice,
          isUnknown,
          aiGeneralInfo,
          area: areaKey
        });

        legacyOutside.push({
          name: rawName,
          value: rawVal,
          unit,
          referenceRange: rawRange,
          status: statusResult.direction === 'HIGHER' ? 'HIGH' : 'LOW',
          sourceFindingId: lr.id || `f-${rawName}`
        });

        legacyFlagged.push({
          name: rawName,
          meaning: whatResultShows,
          sourceFindingId: lr.id || `f-${rawName}`
        });
      } else {
        legacyWithin.push({
          name: rawName,
          value: rawVal,
          unit,
          referenceRange: rawRange,
          status: 'NORMAL',
          sourceFindingId: lr.id || `f-${rawName}`
        });
      }

      if (statusResult.status === 'needs_review') {
        legacyUncertainties.push({
          name: rawName,
          reason: statusResult.reviewReason || 'Reference interval was not specified in the source document.',
          sourceFindingId: lr.id || `f-${rawName}`
        });
      }
      if (lr.flags?.isLowConfidence || lr.isLowConfidence || (lr.confidence != null && lr.confidence < 0.70)) {
        legacyUncertainties.push({
          name: rawName,
          reason: 'Low OCR extraction confidence. Manual verification advised.',
          sourceFindingId: lr.id || `f-${rawName}`
        });
      }

      // Track by area
      if (!areaGroupsMap.has(areaKey)) {
        areaGroupsMap.set(areaKey, { total: 0, outside: 0 });
      }
      const ag = areaGroupsMap.get(areaKey);
      ag.total++;
      if (statusResult.status !== 'in_range') ag.outside++;
    }

    // Step 5 #2: Order outsideRangeCards by severity (far_outside -> clearly_outside -> slightly_outside -> needs_review)
    outsideRangeCards.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] || 99;
      const orderB = STATUS_ORDER[b.status] || 99;
      return orderA - orderB;
    });

    // Step 5 #1: Status Banner
    const totalCount = labResults.length;
    const outsideCount = outsideRangeCards.length;
    const unreadableCount = outsideRangeCards.filter(c => c.status === 'needs_review').length;
    const allInRange = outsideCount === 0;

    const statusBanner = this.buildStatusBanner({
      allInRange,
      outsideCount,
      totalCount,
      unreadableCount,
      language
    });

    // Step 5 #4: Grouped Areas
    const groupedAreas = this.buildGroupedAreas(areaGroupsMap, language);

    // Step 5 #4 & Step 6: Overview paragraph (< 80 words) with strict non-diagnostic validator
    const overview = this.generateSafeOverview({
      totalCount,
      outsideCount,
      unreadableCount,
      reportDate,
      category: report.category,
      language,
      findings: labResults.map(lr => ({
        value: lr.rawValue || lr.numericValue,
        referenceRange: lr.referenceRange?.rawRange
      }))
    });

    // Step 5 #6: What to do next (max 2 bullets) & footer
    const whatToDoNext = this.buildWhatToDoNext(outsideCount, language);
    const footerNotice = language === 'te'
      ? 'ఇది వైద్య నిర్ధారణ కాదు. మీ వైద్యుడే నిర్ణయిస్తారు.'
      : language === 'hi'
      ? 'यह कोई चिकित्सीय निदान नहीं है। आपके डॉक्टर ही निर्णय लेते हैं।'
      : 'Not a diagnosis. Your doctor decides.';

    const legacyDisclaimer = language === 'te'
      ? 'ముఖ్యమైన గమనిక: ఈ AI సారాంశం సమాచార ప్రయోజనాల కోసం మాత్రమే. ఇది వైద్య నిర్ధారణ కాదు. మీ వైద్యుడే నిర్ణయిస్తారు.'
      : language === 'hi'
      ? 'महत्वपूर्ण सूचना: यह एआई सारांश केवल सूचनात्मक उद्देश्यों के लिए है। यह कोई चिकित्सीय निदान नहीं है। आपके डॉक्टर ही निर्णय लेते हैं।'
      : 'This summary is generated by AI for informational purposes and does NOT provide a diagnosis or treatment plan. Always consult your qualified healthcare provider.';

    // Historical Comparisons
    const historicalComparisons = this.computeHistoricalComparisons({
      userId,
      currentReportId: report.id,
      currentReportDate: reportDate,
      currentLabResults: labResults,
      language
    });

    return {
      version: this.SUMMARY_VERSION,
      language,
      reportId: report.id,
      overview,
      statusBanner,
      outsideRangeCards,
      groupedAreas,
      allResults,
      whatToDoNext,
      footerNotice,

      // Legacy fields
      withinReferenceRange: legacyWithin,
      outsideReferenceRange: legacyOutside,
      flaggedExplanations: legacyFlagged,
      historicalComparisons,
      uncertainties: legacyUncertainties,
      nextSteps: whatToDoNext,
      disclaimer: legacyDisclaimer,
      groundingMetadata: {
        totalFindingsEvaluated: totalCount,
        verifiedCount: totalCount - unreadableCount,
        uncertainCount: unreadableCount,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Builds code-built result sentence
   */
  static buildResultSentence({ displayName, value, unit, labRange, status, direction, language }) {
    const valStr = unit ? `${value} ${unit}` : `${value}`;
    const isHigher = direction === 'HIGHER';

    if (language === 'te') {
      if (status === 'in_range') {
        return `మీ ${displayName} విలువ ${valStr} ల్యాబ్ సూచించిన సాధారణ పరిధి (${labRange}) లోపల ఉంది.`;
      }
      if (status === 'slightly_outside') {
        return `మీ ${displayName} విలువ ${valStr} ల్యాబ్ పరిధి (${labRange}) కంటే కొద్దిగా ${isHigher ? 'ఎక్కువగా' : 'తక్కువగా'} ఉంది.`;
      }
      if (status === 'clearly_outside') {
        return `మీ ${displayName} విలువ ${valStr} ల్యాబ్ పరిధి (${labRange}) కంటే స్పష్టంగా ${isHigher ? 'ఎక్కువగా' : 'తక్కువగా'} ఉంది.`;
      }
      if (status === 'far_outside') {
        return `మీ ${displayName} విలువ ${valStr} ల్యాబ్ పరిధి (${labRange}) కంటే చాలా ${isHigher ? 'ఎక్కువగా' : 'తక్కువగా'} ఉంది.`;
      }
      return `మీ ${displayName} విలువ (${valStr}) నివేదికలో స్పష్టమైన రిఫరెన్స్ పరిధి లేనందున సమీక్ష అవసరం.`;
    }

    if (language === 'hi') {
      if (status === 'in_range') {
        return `आपका ${displayName} मान ${valStr} प्रयोगशाला की सामान्य सीमा (${labRange}) के भीतर है।`;
      }
      if (status === 'slightly_outside') {
        return `आपका ${displayName} मान ${valStr} प्रयोगशाला सीमा (${labRange}) से थोड़ा ${isHigher ? 'ज्यादा' : 'कम'} है।`;
      }
      if (status === 'clearly_outside') {
        return `आपका ${displayName} मान ${valStr} प्रयोगशाला सीमा (${labRange}) से स्पष्ट रूप से ${isHigher ? 'ज्यादा' : 'कम'} है।`;
      }
      if (status === 'far_outside') {
        return `आपका ${displayName} मान ${valStr} प्रयोगशाला सीमा (${labRange}) से काफी ${isHigher ? 'ज्यादा' : 'कम'} है।`;
      }
      return `आपके ${displayName} मान (${valStr}) के लिए लैब संदर्भ सीमा उपलब्ध न होने के कारण समीक्षा आवश्यक है।`;
    }

    // English
    if (status === 'in_range') {
      return `Your ${displayName} result of ${valStr} is within the laboratory reference range (${labRange}).`;
    }
    if (status === 'slightly_outside') {
      return `Your ${displayName} result of ${valStr} is slightly ${isHigher ? 'above' : 'below'} the laboratory reference range (${labRange}). Consult your doctor to discuss this result.`;
    }
    if (status === 'clearly_outside') {
      return `Your ${displayName} result of ${valStr} is clearly ${isHigher ? 'above' : 'below'} the laboratory reference range (${labRange}). Consult your doctor to discuss this result.`;
    }
    if (status === 'far_outside') {
      return `Your ${displayName} result of ${valStr} is significantly ${isHigher ? 'above' : 'below'} the laboratory reference range (${labRange}). Consult your doctor to discuss this result.`;
    }
    return `Your ${displayName} result of ${valStr} requires review as the laboratory reference range was not clearly documented. Consult your doctor for clarification.`;
  }

  /**
   * Localized severity labels
   */
  static getLocalizedSeverity(status, language) {
    if (language === 'te') {
      if (status === 'slightly_outside') return 'కొద్దిగా పరిధి వెలుపల';
      if (status === 'clearly_outside') return 'స్పష్టంగా పరిధి వెలుపల';
      if (status === 'far_outside') return 'చాలా ఎక్కువ వ్యత్యాసం';
      if (status === 'needs_review') return 'సమీక్ష అవసరం';
      return 'పరిధిలో ఉంది';
    }
    if (language === 'hi') {
      if (status === 'slightly_outside') return 'थोड़ा सीमा से बाहर';
      if (status === 'clearly_outside') return 'स्पष्ट रूप से सीमा बाहर';
      if (status === 'far_outside') return 'काफी अधिक अंतर';
      if (status === 'needs_review') return 'समीक्षा आवश्यक';
      return 'सामान्य सीमा में';
    }
    if (status === 'slightly_outside') return 'Slightly outside';
    if (status === 'clearly_outside') return 'Clearly outside';
    if (status === 'far_outside') return 'Far outside';
    if (status === 'needs_review') return 'Needs review';
    return 'In range';
  }

  /**
   * Step 5 #1: Builds status banner
   */
  static buildStatusBanner({ allInRange, outsideCount, totalCount, unreadableCount, language }) {
    let headline = '';
    let subtext = null;

    if (language === 'te') {
      headline = allInRange
        ? `మొత్తం ${totalCount} ఫలితాలు ల్యాబ్ సాధారణ పరిధిలో ఉన్నాయి`
        : `${totalCount} ఫలితాలలో ${outsideCount} ల్యాబ్ పరిధి వెలుపల ఉన్నాయి`;
      if (unreadableCount > 0) {
        subtext = `${unreadableCount} ఫలితాలు సరిగ్గా చదవబడలేదు లేదా రిఫరెన్స్ పరిధి లేదు.`;
      }
    } else if (language === 'hi') {
      headline = allInRange
        ? `सभी ${totalCount} परिणाम प्रयोगशाला की सामान्य सीमा में हैं`
        : `${totalCount} में से ${outsideCount} परिणाम प्रयोगशाला सीमा से बाहर हैं`;
      if (unreadableCount > 0) {
        subtext = `${unreadableCount} परिणाम स्पष्ट रूप से पढ़े नहीं जा सके।`;
      }
    } else {
      headline = allInRange
        ? `All ${totalCount} results are within the lab's range`
        : `${outsideCount} of ${totalCount} results are outside the lab's range`;
      if (unreadableCount > 0) {
        subtext = `${unreadableCount} result(s) could not be read clearly.`;
      }
    }

    return {
      headline,
      subtext,
      allInRange,
      outsideCount,
      totalCount,
      unreadableCount
    };
  }

  /**
   * Step 5 #4: Builds grouped areas summary
   */
  static buildGroupedAreas(areaGroupsMap, language) {
    const areaTitles = {
      blood: { en: 'Blood & CBC', te: 'రక్త కణాల పరీక్షలు', hi: 'रक्त जांच' },
      sugar: { en: 'Blood Sugar & Glucose', te: 'రక్తంలో చక్కెర', hi: 'ब्लड शुगर' },
      lipid: { en: 'Lipid & Cholesterol', te: 'కొలెస్ట్రాల్ మరియు కొవ్వులు', hi: 'कोलेस्ट्रॉल' },
      kidney: { en: 'Kidney Function', te: 'మూత్రపిండాల పనితీరు', hi: 'किडनी फंक्शन' },
      liver: { en: 'Liver Function', te: 'కాలేయ పనితీరు', hi: 'लिवर फंक्शन' },
      thyroid: { en: 'Thyroid Hormones', te: 'థైరాయిడ్ హార్మోన్లు', hi: 'थायराइड' },
      vitamins: { en: 'Vitamins & Minerals', te: 'విటమిన్లు మరియు ఖనిజాలు', hi: 'विटामिन' },
      electrolytes: { en: 'Electrolytes & Salts', te: 'ఎలక్ట్రోలైట్లు', hi: 'इलेक्ट्रोलाइट्स' },
      urine: { en: 'Urinalysis Panel', te: 'మూత్ర పరీక్షలు', hi: 'यूरिन जांच' },
      other: { en: 'Other Tests', te: 'ఇతర పరీక్షలు', hi: 'अन्य जांच' }
    };

    const grouped = [];
    for (const [areaKey, counts] of areaGroupsMap.entries()) {
      const titles = areaTitles[areaKey] || areaTitles.other;
      const title = titles[language] || titles.en;

      let sentence = '';
      if (language === 'te') {
        sentence = counts.outside === 0
          ? `${title}: మొత్తం ${counts.total} ఫలితాలు ల్యాబ్ పరిధిలోనే ఉన్నాయి.`
          : `${title}: ${counts.total} పరీక్షలలో ${counts.outside} ల్యాబ్ పరిధి వెలుపల ఉన్నాయి.`;
      } else if (language === 'hi') {
        sentence = counts.outside === 0
          ? `${title}: सभी ${counts.total} परिणाम सामान्य सीमा के भीतर हैं।`
          : `${title}: ${counts.total} में से ${counts.outside} परिणाम सीमा से बाहर पाए गए।`;
      } else {
        sentence = counts.outside === 0
          ? `${title}: All ${counts.total} evaluated result(s) are within standard range.`
          : `${title}: ${counts.outside} of ${counts.total} result(s) are outside the lab's range.`;
      }

      grouped.push({
        areaKey,
        areaTitle: title,
        sentence,
        testCount: counts.total,
        outsideCount: counts.outside
      });
    }

    return grouped;
  }

  /**
   * Generates safe overview (< 80 words) verified against AI output validator
   */
  static generateSafeOverview({ totalCount, outsideCount, unreadableCount, reportDate, category, language, findings }) {
    let candidate = '';

    if (language === 'te') {
      candidate = outsideCount === 0
        ? `${reportDate} నాటి మీ వైద్య నివేదికలో మొత్తం ${totalCount} పరీక్షా పారామితులు విశ్లేషించబడ్డాయి. అన్ని ఫలితాలు ల్యాబ్ సూచించిన పరిధిలోనే ఉన్నాయి.`
        : `${reportDate} నాటి మీ వైద్య నివేదికలో మొత్తం ${totalCount} పరీక్షా పారామితులు విశ్లేషించబడ్డాయి; వీటిలో ${outsideCount} ల్యాబ్ పరిధి వెలుపల ఉన్నాయి. ఈ వివరాలను మీ తదుపరి అపాయింట్‌మెంట్‌లో వైద్యుడితో సమీక్షించండి.`;
    } else if (language === 'hi') {
      candidate = outsideCount === 0
        ? `${reportDate} की आपकी रिपोर्ट में कुल ${totalCount} परीक्षण मापदंडों की समीक्षा की गई। सभी परिणाम प्रयोगशाला सीमा के भीतर हैं।`
        : `${reportDate} की रिपोर्ट में कुल ${totalCount} परीक्षण मापदंडों की समीक्षा की गई; इनमें से ${outsideCount} परिणाम संदर्भ सीमा से बाहर हैं। कृपया अपनी अगली विजिट में डॉक्टर से परामर्श लें।`;
    } else {
      candidate = outsideCount === 0
        ? `Summary of your report on ${reportDate}. Evaluated ${totalCount} test(s). All parameters reside within standard reference bounds.`
        : `Summary of your report on ${reportDate}. Evaluated ${totalCount} test(s); ${outsideCount} reside outside reference bounds. Discuss these results with your healthcare provider.`;
    }

    // Validate strictly against banned words and number grounding
    const valRes = validateAiSummaryOutput(candidate, {
      totalFindings: totalCount,
      outsideCount,
      withinCount: totalCount - outsideCount,
      uncertainCount: unreadableCount,
      reportDate,
      findings
    });

    if (!valRes.isValid) {
      console.warn('[HealthSummaryService] Overview failed validation, using safe template:', valRes.reason);
      return `Report summary for ${reportDate}. Evaluated ${totalCount} test parameters.`;
    }

    return candidate;
  }

  /**
   * Step 5 #6: What to do next (max 2 bullets)
   */
  static buildWhatToDoNext(outsideCount, language) {
    if (language === 'te') {
      return [
        'ఈ నివేదికలోని ఫలితాలను మీ తదుపరి అపాయింట్‌మెంట్‌లో చికిత్స అందించే వైద్యుడితో చర్చించండి.',
        'వైద్యుడి సూచన లేకుండా మందుల మోతాదులను మార్చవద్దు లేదా చికిత్సను నిలిపివేయవద్దు.'
      ];
    }
    if (language === 'hi') {
      return [
        'अपनी अगली क्लिनिकल विजिट के दौरान इन परिणामों पर अपने डॉक्टर से परामर्श करें।',
        'डॉक्टर की सलाह के बिना अपनी दवाओं या खुराक में कोई बदलाव न करें।'
      ];
    }
    return [
      'Discuss these documented findings with your physician during your next scheduled appointment.',
      'Do not adjust medications or therapies without direct guidance from your healthcare provider.'
    ];
  }

  /**
   * Logs uncataloged test names to missing_knowledge table (Step 5 #3)
   */
  static logMissingKnowledge({ testName, rawValue, referenceRange, reportId, userId }) {
    try {
      const now = new Date().toISOString();
      const id = `mk-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO missing_knowledge (id, test_name, raw_value, reference_range, report_id, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, testName, String(rawValue || ''), String(referenceRange || ''), reportId || null, userId || null, now);
    } catch (err) {
      // Non-blocking log
    }
  }

  /**
   * Historical comparisons logic
   */
  static computeHistoricalComparisons({ userId, currentReportId, currentReportDate, currentLabResults, language }) {
    const comparisons = [];
    if (!currentLabResults || currentLabResults.length === 0) return comparisons;

    for (const lr of currentLabResults) {
      if (lr.historicalReadings && Array.isArray(lr.historicalReadings) && lr.historicalReadings.length > 0) {
        const prior = lr.historicalReadings[0];
        if (prior.date && prior.value) {
          const currentVal = lr.numericValue != null ? lr.numericValue : parseFloat(lr.rawValue);
          const priorVal = prior.numericValue != null ? prior.numericValue : parseFloat(prior.value);

          let trend = 'STABLE';
          if (!isNaN(currentVal) && !isNaN(priorVal)) {
            if (currentVal > priorVal) trend = 'INCREASED';
            else if (currentVal < priorVal) trend = 'DECREASED';
          }

          comparisons.push({
            name: lr.name,
            currentDate: currentReportDate,
            currentValue: `${lr.rawValue || lr.numericValue} ${lr.unit || ''}`.trim(),
            priorDate: prior.date,
            priorValue: `${prior.value} ${prior.unit || lr.unit || ''}`.trim(),
            unit: lr.unit || '',
            trend,
            observation: `${lr.name}: ${priorVal} (${prior.date}) -> ${currentVal} (${currentReportDate})`
          });
        }
      }
    }
    return comparisons;
  }

  /**
   * Safe fallback template if any exception occurs
   */
  static generateFallbackTemplateSummary({ report, language, dataHash }) {
    const reportDate = report.report_date || report.reportDate || 'Unknown Date';
    const reportTitle = report.title || 'Medical Report';
    return {
      version: this.SUMMARY_VERSION,
      language,
      reportId: report.id,
      overview: `Summary of ${reportTitle} on ${reportDate}.`,
      statusBanner: {
        headline: 'Report Loaded',
        subtext: 'Clinical parameters recorded.',
        allInRange: true,
        outsideCount: 0,
        totalCount: 0,
        unreadableCount: 0
      },
      outsideRangeCards: [],
      groupedAreas: [],
      allResults: [],
      whatToDoNext: this.buildWhatToDoNext(0, language),
      footerNotice: language === 'te' ? 'ఇది వైద్య నిర్ధారణ కాదు. మీ వైద్యుడే నిర్ణయిస్తారు.' : language === 'hi' ? 'यह कोई चिकित्सीय निदान नहीं है। आपके डॉक्टर ही निर्णय लेते हैं।' : 'Not a diagnosis. Your doctor decides.',
      withinReferenceRange: [],
      outsideReferenceRange: [],
      flaggedExplanations: [],
      historicalComparisons: [],
      uncertainties: [],
      nextSteps: this.buildWhatToDoNext(0, language),
      disclaimer: 'Not a diagnosis. Your doctor decides.',
      groundingMetadata: {
        totalFindingsEvaluated: 0,
        verifiedCount: 0,
        uncertainCount: 0,
        generatedAt: new Date().toISOString()
      }
    };
  }
}
