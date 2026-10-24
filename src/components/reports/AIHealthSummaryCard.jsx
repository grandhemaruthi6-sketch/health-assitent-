import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
];

export const AIHealthSummaryCard = ({ reportId, report }) => {
  const [language, setLanguage] = useState('en');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);

  // Collapsible States
  const [showAllResults, setShowAllResults] = useState(false);
  const [expandedTestKey, setExpandedTestKey] = useState(null);

  // In-memory cache across language toggles to ensure instantaneous switching without re-calling
  const [summaryCache, setSummaryCache] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      if (!reportId) return;

      // Check client-side memory cache first for instant toggle
      if (summaryCache[language]) {
        setSummary(summaryCache[language]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.reports.getSummary(reportId, language);
        if (isMounted && data) {
          setSummary(data);
          setSummaryCache(prev => ({ ...prev, [language]: data }));
        }
      } catch (err) {
        if (isMounted) {
          // If network fails, construct safe non-AI fallback from current report object
          if (report && (report.biomarkers || report.aiSummary)) {
            const fallback = buildLocalFallbackSummary(report, language);
            setSummary(fallback);
            setSummaryCache(prev => ({ ...prev, [language]: fallback }));
          } else {
            setError(err.message || 'Could not load health summary.');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [reportId, language, report]);

  const handleRegenerate = async () => {
    if (!reportId || isRegenerating) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const data = await apiClient.reports.generateSummary(reportId, language, true);
      setSummary(data);
      setSummaryCache(prev => ({ ...prev, [language]: data }));
    } catch (err) {
      setError(err.message || 'Regeneration failed. Please check network connection.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getLanguageFontClass = () => {
    if (language === 'te') return 'font-["Noto_Sans_Telugu",sans-serif] leading-relaxed';
    if (language === 'hi') return 'font-["Noto_Sans_Devanagari",sans-serif] leading-relaxed';
    return 'font-sans';
  };

  const banner = summary?.statusBanner;
  const outsideCards = summary?.outsideRangeCards || [];
  const groupedAreas = summary?.groupedAreas || [];
  const allResults = summary?.allResults || [];

  return (
    <section 
      aria-label="Your Report Summary Card"
      className={`bg-white rounded-3xl border border-teal-200/90 shadow-sm overflow-hidden transition-all duration-200 ${getLanguageFontClass()}`}
    >
      {/* ===================================================================== */}
      {/* TOP HEADER & LANGUAGE SWITCHER (Instant Toggle)                       */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 px-5 py-4 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
            ✨
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {language === 'te' ? 'మీ నివేదిక సారాంశం' : language === 'hi' ? 'आपकी रिपोर्ट का सारांश' : 'Your Report Summary'}
            </h2>
            <span className="text-xs text-teal-800 font-semibold block">
              {language === 'te' ? 'ల్యాబ్ పరిధి విశ్లేషణ • తెలుగు' : language === 'hi' ? 'लैब संदर्भ विश्लेषण • हिन्दी' : 'Evidence-Grounded Clinical Analysis'}
            </span>
          </div>
        </div>

        {/* Language Switcher Pills & Refresh Button */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-xl bg-white p-1 border border-teal-200 shadow-2xs">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  language === lang.code
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                aria-label={`Switch language to ${lang.label}`}
              >
                {lang.native}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || isLoading}
            className="w-8 h-8 rounded-xl bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold shadow-2xs transition disabled:opacity-50"
            title="Refresh summary"
            aria-label="Refresh summary"
          >
            <span className={isRegenerating ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Loading Spinner */}
        {isLoading && !summary && (
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-500">
              {language === 'te' ? 'సారాంశం లోడ్ అవుతోంది...' : language === 'hi' ? 'सारांश लोड हो रहा है...' : 'Loading report summary...'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
            ⚠️ {error}
          </div>
        )}

        {summary && (
          <>
            {/* ================================================================= */}
            {/* 1. STATUS BANNER (Step 5 #1: Large Text & Icon)                   */}
            {/* ================================================================= */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition ${
              banner?.allInRange
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-start space-x-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold shadow-xs ${
                  banner?.allInRange ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {banner?.allInRange ? '✓' : '⚠️'}
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-extrabold leading-snug">
                    {banner?.headline || (banner?.allInRange ? "All results are within the lab's range" : "Out of range results detected")}
                  </h3>
                  {banner?.subtext && (
                    <p className="text-xs sm:text-sm font-medium mt-1 text-slate-600">
                      ℹ️ {banner.subtext}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 2. OUTSIDE-RANGE CARDS (Step 5 #2: Problems first, ordered)       */}
            {/* ================================================================= */}
            {outsideCards.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>
                      {language === 'te'
                        ? `పరిశీలించవలసిన ఫలితాలు (${outsideCards.length})`
                        : language === 'hi'
                        ? `समीक्षा योग्य परिणाम (${outsideCards.length})`
                        : `Results Outside Lab Range (${outsideCards.length})`}
                    </span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {language === 'te' ? 'తీవ్రత క్రమంలో' : language === 'hi' ? 'गंभीरता के अनुसार' : 'Ordered by Severity'}
                  </span>
                </div>

                <div className="space-y-4">
                  {outsideCards.map((card, idx) => {
                    const isFar = card.status === 'far_outside';
                    return (
                      <article
                        key={`${card.testName}-${idx}`}
                        className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition space-y-3.5 ${
                          isFar
                            ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300/40'
                            : 'border-amber-200/90 bg-white'
                        }`}
                      >
                        {/* Card Header: Test Name, Value, Range, Arrow, Severity Label */}
                        <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                              {card.displayName}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {card.sourceReport} • {card.reportDate}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                              {card.severityLabel}
                            </span>
                            <span className="text-lg font-extrabold text-amber-700">
                              {card.arrow}
                            </span>
                          </div>
                        </div>

                        {/* Observed Value vs Lab Range */}
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between text-xs sm:text-sm">
                          <div>
                            <span className="text-slate-500 block text-xs">
                              {language === 'te' ? 'మీ ఫలితం:' : language === 'hi' ? 'आपका परिणाम:' : 'Your Result:'}
                            </span>
                            <span className="text-base font-extrabold text-slate-900">
                              {card.value} {card.unit || ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-xs">
                              {language === 'te' ? 'ల్యాబ్ సూచించిన పరిధి:' : language === 'hi' ? 'लैब संदर्भ सीमा:' : "Lab's Reference Range:"}
                            </span>
                            <span className="font-bold text-slate-700">
                              {card.labRange}
                            </span>
                          </div>
                        </div>

                        {/* What your result shows */}
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                          <p>🔍 {card.whatResultShows}</p>
                        </div>

                        {/* What is this test? */}
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            {language === 'te' ? 'ఈ పరీక్ష దేనిని కొలుస్తుంది?' : language === 'hi' ? 'यह टेस्ट क्या मापता है?' : 'What is this test?'}
                          </h5>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {card.whatIsThisTest}
                          </p>
                          {card.isUnknown && card.aiGeneralInfo && (
                            <span className="inline-block mt-1 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200">
                              {card.aiGeneralInfo}
                            </span>
                          )}
                        </div>

                        {/* Common reasons (NO causes for unknown tests) */}
                        {!card.isUnknown && card.commonReasons && card.commonReasons.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                              {language === 'te'
                                ? 'సాధారణంగా ఈ విలువ మారడానికి కారణాలు:'
                                : language === 'hi'
                                ? 'सामान्य कारण जिनसे यह मान बदल सकता है:'
                                : 'Common reasons a value can be higher/lower (General Information):'}
                            </h5>
                            <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-slate-700">
                              {card.commonReasons.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-slate-400 mt-1 italic">
                              {language === 'te' ? '*ఇది సాధారణ సమాచారం మాత్రమే, వ్యాధి నిర్ధారణ కాదు.' : language === 'hi' ? '*यह केवल सामान्य जानकारी है, कोई बीमारी की पुष्टि नहीं।' : '*General educational factors; not a diagnosis.'}
                            </p>
                          </div>
                        )}

                        {/* Questions to ask doctor */}
                        {card.questionsForDoctor && card.questionsForDoctor.length > 0 && (
                          <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                            <h5 className="text-xs font-bold text-sky-900 mb-1 flex items-center gap-1">
                              <span>💬</span>
                              <span>
                                {language === 'te' ? 'మీ వైద్యుడిని అడగవలసిన ప్రశ్నలు:' : language === 'hi' ? 'डॉक्टर से पूछने योग्य सवाल:' : 'Questions to ask your doctor:'}
                              </span>
                            </h5>
                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-sky-950">
                              {card.questionsForDoctor.map((q, qIdx) => (
                                <li key={qIdx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Urgent notice for far_outside */}
                        {card.urgentDoctorNotice && (
                          <div className="p-3 bg-amber-100/80 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                            <span>🚨</span>
                            <span>{card.urgentDoctorNotice}</span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 4. "YOUR FULL REPORT EXPLAINED" (Step 5 #4)                       */}
            {/* ================================================================= */}
            <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📋</span>
                <span>
                  {language === 'te' ? 'మీ పూర్తి నివేదిక వివరణ' : language === 'hi' ? 'आपकी पूरी रिपोर्ट का सारांश' : 'Your Full Report Explained'}
                </span>
              </h3>

              {/* Short overview paragraph (< 80 words) */}
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {summary.overview}
              </p>

              {/* Grouped Areas with 1 plain sentence each */}
              {groupedAreas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/70">
                  {groupedAreas.map((group) => (
                    <div
                      key={group.areaKey}
                      className="bg-white p-3 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-0.5 shadow-2xs"
                    >
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        {group.areaTitle}
                      </h4>
                      <p className="text-slate-600 leading-snug">
                        {group.sentence}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* 5. COLLAPSED "SEE ALL RESULTS" (Step 5 #5)                        */}
            {/* ================================================================= */}
            {allResults.length > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAllResults(v => !v)}
                  className="w-full px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>📑</span>
                    <span>
                      {language === 'te'
                        ? `మొత్తం ఫలితాలన్నీ చూడండి (${allResults.length})`
                        : language === 'hi'
                        ? `सभी परिणाम देखें (${allResults.length})`
                        : `See All Results (${allResults.length})`}
                    </span>
                  </span>
                  <span className="text-brand-600 font-extrabold">
                    {showAllResults ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showAllResults && (
                  <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                    {allResults.map((item, idx) => {
                      const isExpanded = expandedTestKey === idx;
                      const isNormal = item.status === 'in_range';
                      return (
                        <div key={idx} className="p-3.5 hover:bg-slate-50/60 transition space-y-1">
                          <div
                            onClick={() => setExpandedTestKey(isExpanded ? null : idx)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex-1 pr-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {item.displayName}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Ref: {item.labRange}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-slate-800">
                                {item.value} {item.unit || ''}
                              </span>
                              <span className={`block text-xs font-bold ${
                                isNormal ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                {item.arrow} {isNormal ? 'In range' : 'Flagged'}
                              </span>
                            </div>
                          </div>

                          {/* Collapsible Plain Meaning */}
                          {isExpanded && (
                            <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <p className="font-semibold text-slate-700 mb-0.5">
                                {language === 'te' ? 'పరీక్ష వివరణ:' : language === 'hi' ? 'टेस्ट का अर्थ:' : 'Test Meaning:'}
                              </p>
                              <p>{item.plainMeaning}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* 6. WHAT TO DO NEXT & FOOTER (Step 5 #6)                           */}
            {/* ================================================================= */}
            <div className="space-y-3 pt-2">
              <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>
                    {language === 'te' ? 'తదుపరి ఏమి చేయాలి?' : language === 'hi' ? 'आगे क्या करें?' : 'What to Do Next'}
                  </span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-teal-950 font-medium">
                  {(summary.whatToDoNext || []).slice(0, 2).map((item, nIdx) => (
                    <li key={nIdx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Legal Non-Diagnostic Footer in 3 Languages */}
              <div className="text-center py-2 px-3 bg-slate-100/70 rounded-xl border border-slate-200/60">
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  ⚖️ {summary.footerNotice || "Not a diagnosis. Your doctor decides."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

/**
 * Builds safe non-AI fallback summary from report object if network request fails
 */
function buildLocalFallbackSummary(report, language) {
  const biomarkers = report.biomarkers || [];
  const outsideCount = biomarkers.filter(b => b.status !== 'Normal').length;
  const totalCount = biomarkers.length;
  const allInRange = outsideCount === 0;

  return {
    version: 2,
    language,
    reportId: report.id || 'sample',
    overview: report.aiSummary || `Clinical findings for ${report.title || 'medical report'}.`,
    statusBanner: {
      headline: allInRange
        ? (language === 'te' ? `మొత్తం ${totalCount} ఫలితాలు ల్యాబ్ సాధారణ పరిధిలో ఉన్నాయి` : language === 'hi' ? `सभी ${totalCount} परिणाम सामान्य सीमा में हैं` : `All ${totalCount} results are within the lab's range`)
        : (language === 'te' ? `${totalCount} ఫలితాలలో ${outsideCount} ల్యాబ్ పరిధి వెలుపల ఉన్నాయి` : language === 'hi' ? `${totalCount} में से ${outsideCount} परिणाम सीमा से बाहर हैं` : `${outsideCount} of ${totalCount} results are outside the lab's range`),
      subtext: null,
      allInRange,
      outsideCount,
      totalCount,
      unreadableCount: 0
    },
    outsideRangeCards: biomarkers.filter(b => b.status !== 'Normal').map(b => ({
      testName: b.name,
      displayName: b.name,
      value: String(b.value),
      unit: b.unit || '',
      labRange: b.rawRange || `${b.minRange ?? ''} - ${b.maxRange ?? ''}`.trim(),
      status: 'clearly_outside',
      direction: b.status === 'Low' ? 'LOWER' : 'HIGHER',
      arrow: b.status === 'Low' ? '↓' : '↑',
      severityLabel: 'Outside range',
      sourceReport: report.title || 'Medical Report',
      reportDate: report.reportDate || report.date || '2026-10-15',
      whatIsThisTest: b.explanation || 'Laboratory diagnostic test.',
      whatResultShows: `${b.name} reading is outside reference limits.`,
      commonReasons: [],
      questionsForDoctor: ['Review this finding with your attending physician.'],
      urgentDoctorNotice: null,
      isUnknown: false,
      aiGeneralInfo: null,
      area: 'other'
    })),
    groupedAreas: [],
    allResults: biomarkers.map(b => ({
      testName: b.name,
      displayName: b.name,
      value: String(b.value),
      unit: b.unit || '',
      labRange: b.rawRange || 'Unavailable',
      status: b.status === 'Normal' ? 'in_range' : 'clearly_outside',
      arrow: b.status === 'Normal' ? '✓' : (b.status === 'Low' ? '↓' : '↑'),
      plainMeaning: b.explanation || 'Clinical measurement.',
      area: 'other'
    })),
    whatToDoNext: [
      language === 'te' ? 'ఈ ఫలితాలను మీ వైద్యుడితో చర్చించండి.' : language === 'hi' ? 'इन परिणामों पर डॉक्टर से सलाह लें।' : 'Discuss these results with your healthcare provider.',
      language === 'te' ? 'వైద్యుడి సూచన లేకుండా మందులు మార్చవద్దు.' : language === 'hi' ? 'डॉक्टर की सलाह बिना दवाएं न बदलें।' : 'Do not change medications without clinical guidance.'
    ],
    footerNotice: language === 'te' ? 'ఇది వైద్య నిర్ధారణ కాదు. మీ వైద్యుడే నిర్ణయిస్తారు.' : language === 'hi' ? 'यह कोई चिकित्सीय निदान नहीं है। आपके डॉक्टर ही निर्णय लेते हैं।' : 'Not a diagnosis. Your doctor decides.',
    withinReferenceRange: [],
    outsideReferenceRange: [],
    flaggedExplanations: [],
    historicalComparisons: [],
    uncertainties: [],
    nextSteps: [],
    disclaimer: 'Not a diagnosis. Your doctor decides.',
    groundingMetadata: {
      totalFindingsEvaluated: totalCount,
      verifiedCount: totalCount,
      uncertainCount: 0,
      generatedAt: new Date().toISOString()
    }
  };
}
