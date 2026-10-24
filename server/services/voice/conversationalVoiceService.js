import { db } from '../../db/database.js';
import { PatientKnowledgeService } from '../knowledge/patientKnowledgeService.js';
import { answerMedicineChangeQuery } from '../continuity/companionTools.js';

export const GREETINGS = {
  te: "నమస్కారం! నేను HealthCopilot అసిస్టెంట్ని. మీకు ఎలా సహాయపడగలను?",
  en: "Hello! I'm your HealthCopilot assistant. How can I help you today?",
  hi: "नमस्ते! मैं आपका HealthCopilot असिस्टेंट हूँ। मैं आपकी कैसे मदद कर सकता हूँ?"
};

export const LANGUAGE_LOCALES = {
  te: 'te-IN',
  en: 'en-IN',
  hi: 'hi-IN'
};

// Emergency red flag terms indicating potentially urgent symptoms
const EMERGENCY_SYMPTOMS = {
  en: ['chest pain', 'heart attack', 'shortness of breath', 'cannot breathe', 'difficulty breathing', 'severe bleeding', 'stroke', 'face drooping', 'slurred speech', 'sudden weakness', 'unconscious', 'fainting', 'anaphylaxis', 'blue lips'],
  te: ['ఛాతీ నొప్పి', 'గుండె నొప్పి', 'శ్వాస తీసుకోవడంలో ఇబ్బంది', 'శ్వాస అందకపోవడం', 'తీవ్రమైన రక్తస్రావం', 'పక్షవాతం', 'స్పృహ తప్పడం', 'మూర్ఛ'],
  hi: ['सीने में दर्द', 'सांस लेने में तकलीफ', 'सांस फूलना', 'दिल का दौरा', 'भारी रक्तस्राव', 'बेहोश', 'पक्षाघात', 'लकवा', 'अचेत']
};

/**
 * Detect language from text content (Telugu script, Devanagari script, or English/Romanized)
 */
export function detectLanguage(text, defaultLang = 'en') {
  if (!text || typeof text !== 'string') return defaultLang;
  
  // Telugu Unicode range: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  
  // Devanagari (Hindi) Unicode range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  
  // Check common Romanized Telugu words (code-switching)
  const lower = text.toLowerCase();
  if (/\b(namaskaram|ela|unnanu|undha|undi|cheppandi|chudandi|naa|naaku|telugu|report lo|hemoglobin ela|upload cheyali|scan cheyali)\b/i.test(lower)) {
    return 'te';
  }
  
  // Check common Romanized Hindi words
  if (/\b(namaste|kaisa|kaisi|hai|batao|bataiye|mera|meri|kripya|hindi|report me|upload karna|scan karna)\b/i.test(lower)) {
    return 'hi';
  }
  
  return defaultLang;
}

/**
 * Checks for emergency symptoms requiring immediate medical evaluation
 */
export function checkEmergencyTriage(queryText) {
  if (!queryText) return null;
  const lower = queryText.toLowerCase();

  for (const lang of ['en', 'te', 'hi']) {
    for (const symptom of EMERGENCY_SYMPTOMS[lang]) {
      if (lower.includes(symptom.toLowerCase()) || queryText.includes(symptom)) {
        return {
          detected: true,
          symptom,
          guidance: {
            en: "⚠️ URGENT MEDICAL ADVICE: If you or someone with you is experiencing severe symptoms like chest pain, severe difficulty breathing, or sudden numbness, please contact emergency medical services (108 in India or 911) or visit the nearest emergency department immediately.",
            te: "⚠️ అత్యవసర వైద్య సూచన: మీకు ఛాతీ నొప్పి, తీవ్రమైన శ్వాస ఇబ్బంది లేదా ఆకస్మిక బలహీనత వంటి అత్యవసర లక్షణాలు ఉంటే, దయచేసి వెంటనే అత్యవసర సేవలైన 108 కు కాల్ చేయండి లేదా సమీప ఆసుపత్రి ఎమర్జెన్సీ విభాగానికి వెళ్లండి.",
            hi: "⚠️ आपातकालीन चिकित्सा सलाह: यदि आप सीने में दर्द, सांस लेने में अत्यधिक कठिनाई या अचानक कमजोरी जैसे गंभीर लक्षणों का अनुभव कर रहे हैं, तो कृपया तुरंत आपातकालीन सेवाओं (108) पर कॉल करें या निकटतम आपातकालीन अस्पताल जाएं।"
          }
        };
      }
    }
  }

  return null;
}

/**
 * Checks if the user is asking to upload or scan a report/document
 */
export function checkUploadIntent(queryText) {
  if (!queryText) return false;
  const lower = queryText.toLowerCase();

  // English flexible action + document matching
  const hasActionVerb = /\b(upload|scan|take photo|take picture|snap|capture|camera)\b/i.test(lower);
  const hasMedicalDoc = /\b(document|report|file|prescription|test|image|pdf|lab)\b/i.test(lower);
  if (hasActionVerb && hasMedicalDoc) return true;

  const enKeywords = [
    'upload document', 'upload report', 'upload file', 'scan document',
    'scan report', 'i want to upload', 'want to upload', 'can i upload',
    'how to upload', 'open scanner', 'take a scan'
  ];
  if (enKeywords.some(k => lower.includes(k))) return true;

  // Telugu flexible action + document matching
  const hasTeAction = /(అప్‌లోడ్|అప్ లోడ్|స్కాన్|ఫోటో|పెట్టాలి)/.test(queryText) || /(upload|scan)/i.test(lower);
  const hasTeDoc = /(రిపోర్ట్|డాక్యుమెంట్|పరీక్ష|ల్యాబ్|కాగితం)/.test(queryText) || /(report|document|lab)/i.test(lower);
  if (hasTeAction && hasTeDoc) return true;

  // Hindi flexible action + document matching
  const hasHiAction = /(अपलोड|स्कैन|फोटो खींच)/.test(queryText) || /(upload|scan)/i.test(lower);
  const hasHiDoc = /(दस्तावेज़|दस्तावेज|रिपोर्ट|पर्चा|जांच)/.test(queryText) || /(report|document)/i.test(lower);
  if (hasHiAction && hasHiDoc) return true;

  return false;
}

export function getUploadPromptResponse(language = 'en') {
  if (language === 'te') {
    return {
      text: "తప్పకుండా! మీ మెడికల్ రిపోర్ట్‌ను స్కాన్ లేదా అప్‌లోడ్ చేయడానికి నేను సిద్ధంగా ఉన్నాను. మీరు కెమెరాతో స్కాన్ చేయాలనుకుంటున్నారా, లేదా మీ ఫోన్ నుండి PDF/ఫోటో అప్‌లోడ్ చేయాలనుకుంటున్నారా? కింద ఉన్న బటన్‌ను నొక్కండి లేదా మీ ప్రాధాన్యతను చెప్పండి.",
      followUps: ["📸 కెమెరాతో స్కాన్ చేయండి", "📁 PDF లేదా ఫోటో అప్‌లోడ్", "⚡ శాంపిల్ CBC రిపోర్ట్"]
    };
  } else if (language === 'hi') {
    return {
      text: "ज़रूर! मैं आपकी मेडिकल रिपोर्ट अपलोड या स्कैन करने में मदद करने के लिए तैयार हूँ। क्या आप कैमरे से स्कैन करना चाहते हैं, या अपने फोन से PDF/फोटो अपलोड करना चाहते हैं? नीचे विकल्प चुनें या मुझे बताएं।",
      followUps: ["📸 कैमरे से स्कैन करें", "📁 PDF या फोटो अपलोड करें", "⚡ सैंपल CBC रिपोर्ट"]
    };
  } else {
    return {
      text: "I would be delighted to help you upload your medical report! Would you like to scan it right now with your camera, or upload a PDF/photo from your device? You can select an option below or speak your choice.",
      followUps: ["📸 Scan with Camera", "📁 Upload PDF or Photo", "⚡ Try Sample CBC Report"]
    };
  }
}

/**
 * Builds everyday, beginner-friendly medical explanations with memorable analogies
 */
export function generateSimpleHumanBreakdown({ report, labResults = [], language = 'en' }) {
  const analogies = {
    hemoglobin: {
      en: "Hemoglobin acts like little delivery trucks in your bloodstream that carry fresh oxygen from your lungs to your muscles and brain.",
      te: "హిమోగ్లోబిన్ అనేది మీ రక్తంలో తాజా ఆక్సిజన్‌ను శరీరంలోని అన్ని భాగాలకు చేరవేసే డెలివరీ వాహనం వంటిది.",
      hi: "हीमोग्लोबिन आपके रक्त में डिलीवरी वैन की तरह है, जो फेफड़ों से पूरे शरीर तक ताज़ा ऑक्सीजन पहुँचाता है।"
    },
    wbc: {
      en: "White blood cells (WBC) are your body's defense soldiers and immune army that protect you from infections, bacteria, and viruses.",
      te: "తెల్ల రక్తకణాలు (WBC) మీ శరీర సైనికుల వంటివి. ఇవి ఇన్ఫెక్షన్లు, బ్యాక్టీరియా మరియు వైరస్‌ల నుండి మిమ్మల్ని రక్షిస్తాయి.",
      hi: "श्वेत रक्त कोशिकाएं (WBC) आपके शरीर की रक्षक सेना हैं, जो संक्रमण और कीटाणुओं से आपकी रक्षा करती हैं।"
    },
    platelets: {
      en: "Platelets are your natural bandage makers that quickly clump together to stop bleeding whenever you get a cut.",
      te: "ప్లేట్‌లెట్స్ మీ శరీర సహజమైన బ్యాండేజ్‌ల వంటివి. ఏదైనా దెబ్బ తగిలినప్పుడు రక్తం కారకుండా త్వరగా గడ్డకట్టేలా చేస్తాయి.",
      hi: "प्लेटलेट्स प्राकृतिक पट्टी की तरह काम करते हैं, जो चोट लगने पर रक्तस्राव को रोकते हैं।"
    },
    glucose: {
      en: "Blood sugar (Glucose) is the daily fuel your body burns for energy to keep you active and alert.",
      te: "బ్లడ్ షుగర్ (గ్లూకోజ్) అనేది మీ శరీరానికి మరియు మెదడుకు రోజంతా శక్తినిచ్చే సహజ ఇంధనం.",
      hi: "ब्लड शुगर (ग्लूकोज) आपके शरीर और मस्तिष्क को पूरे दिन ऊर्जा देने वाला ईंधन है।"
    },
    creatinine: {
      en: "Creatinine shows how cleanly and effectively your kidneys are filtering natural waste products from your blood.",
      te: "క్రియాటినిన్ మీ మూత్రపిండాలు వ్యర్థాలను ఎంత సమర్థవంతంగా శుభ్రపరుస్తున్నాయో తెలియజేస్తుంది.",
      hi: "क्रिएटिनिन यह दिखाता है कि आपकी किडनी कितनी अच्छी तरह रक्त से अशुद्धियों को साफ कर रही है।"
    }
  };

  const normalList = [];
  const watchList = [];
  const doctorQuestions = [];

  for (const lr of labResults) {
    const isNormal = lr.status === 'NORMAL';
    const name = lr.name;
    const val = lr.rawValue || lr.numericValue;
    const unit = lr.unit || '';
    const key = (name || '').toLowerCase();

    let matchedAnalogy = null;
    if (key.includes('hemoglobin') || key.includes('hb')) matchedAnalogy = analogies.hemoglobin[language];
    else if (key.includes('wbc') || key.includes('white blood')) matchedAnalogy = analogies.wbc[language];
    else if (key.includes('platelet')) matchedAnalogy = analogies.platelets[language];
    else if (key.includes('glucose') || key.includes('sugar')) matchedAnalogy = analogies.glucose[language];
    else if (key.includes('creatinine')) matchedAnalogy = analogies.creatinine[language];

    if (isNormal) {
      normalList.push({
        name,
        value: `${val} ${unit}`.trim(),
        meaning: matchedAnalogy || (language === 'te' ? 'ఆరోగ్యకరమైన సాధారణ పరిధిలో ఉంది.' : (language === 'hi' ? 'पूरी तरह सामान्य स्थिति में है।' : 'Completely healthy and within standard bounds.'))
      });
    } else {
      watchList.push({
        name,
        value: `${val} ${unit}`.trim(),
        status: lr.status,
        meaning: matchedAnalogy || (language === 'te' ? 'పరిధికి కొద్దిగా భిన్నంగా ఉంది.' : (language === 'hi' ? 'सामान्य सीमा से थोड़ा अलग है।' : 'Slightly outside usual bounds.')),
        reassurance: language === 'te'
          ? 'ఆందోళన పడాల్సిన అవసరం లేదు. తాత్కాలిక ఒత్తిడి, నిద్రలేమి, లేదా స్వల్ప అలర్జీ వల్ల ఇలా మారవచ్చు.'
          : language === 'hi'
          ? 'घबराने की कोई बात नहीं है। यह हल्का तनाव, कम नींद या सामान्य एलर्जी के कारण भी हो सकता है।'
          : 'No need to panic—mild shifts can happen from simple hydration, mild stress, or routine body adjustments.'
      });
    }
  }

  // Generate Doctor Questions
  if (watchList.length > 0) {
    if (language === 'te') {
      doctorQuestions.push(`నా ${watchList[0].name} కొద్దిగా భిన్నంగా ఉండటానికి కారణం ఏమిటి?`);
      doctorQuestions.push(`నేను ఆహారంలో లేదా అలవాట్లలో ఏవైనా మార్పులు చేసుకోవాలా?`);
    } else if (language === 'hi') {
      doctorQuestions.push(`मेरे ${watchList[0].name} स्तर में हल्के बदलाव का क्या कारण हो सकता है?`);
      doctorQuestions.push(`क्या मुझे अपनी डाइट या दिनचर्या में कोई बदलाव करने की ज़रूरत है?`);
    } else {
      doctorQuestions.push(`What could be the primary reason for my ${watchList[0].name} being slightly shifted?`);
      doctorQuestions.push(`Do I need to make any lifestyle or dietary adjustments based on this result?`);
    }
  } else {
    if (language === 'te') {
      doctorQuestions.push(`నా తాజా ఫలితాలు అన్నీ బాగున్నాయి. తదుపరి రెగ్యులర్ చెకప్ ఎప్పుడు చేయించుకోవాలి?`);
    } else if (language === 'hi') {
      doctorQuestions.push(`मेरी सभी रिपोर्ट सामान्य हैं। अगली नियमित जांच कब करानी चाहिए?`);
    } else {
      doctorQuestions.push(`My parameters look healthy. When should I schedule my next routine checkup?`);
    }
  }

  return {
    analogySummary: normalList.concat(watchList).map(x => x.meaning).filter(Boolean).slice(0, 2).join(' '),
    normalFindings: normalList,
    watchFindings: watchList,
    doctorQuestions
  };
}

export class ConversationalVoiceService {
  /**
   * Retrieves active voice configuration and greetings
   */
  static getVoiceConfig() {
    const hasGcpCredentials = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_CREDENTIALS_JSON
    );

    return {
      success: true,
      supportedLanguages: [
        { code: 'te', locale: 'te-IN', label: 'తెలుగు (Telugu)', nativeName: 'తెలుగు' },
        { code: 'en', locale: 'en-IN', label: 'English (India)', nativeName: 'English' },
        { code: 'hi', locale: 'hi-IN', label: 'हिन्दी (Hindi)', nativeName: 'हिन्दी' }
      ],
      defaultLanguage: 'en',
      greetings: GREETINGS,
      speechSynthesis: {
        provider: hasGcpCredentials ? 'cloud-and-browser' : 'browser-natural',
        isCloudTtsConfigured: hasGcpCredentials,
        preferredVoices: {
          te: ['Google తెలుగు', 'Microsoft Mohan Online (Natural) - Telugu (India)', 'te-IN'],
          hi: ['Google हिन्दी', 'Microsoft Hemant Online (Natural) - Hindi (India)', 'Microsoft Kalpana', 'hi-IN'],
          en: ['Google Indian English', 'Microsoft Neerja Online (Natural) - English (India)', 'Microsoft Ravi', 'en-IN']
        },
        recommendedProsody: {
          rate: 0.95,
          pitch: 1.0,
          sentencePauseMs: 350
        }
      }
    };
  }

  /**
   * Handles interactive post-upload questions (Date -> Hospital -> Doctor -> Context/Symptoms)
   */
  static async processPostUploadInterviewStep({ userId, visitId = null, reportId = null, step, answer, language = 'en' }) {
    const cleanedAnswer = (answer || '').trim();
    const now = new Date().toISOString();

    let nextStep = null;
    let nextPrompt = '';
    let completed = false;

    if (step === 'CONFIRM_DATE') {
      // Step 1: Confirmed or updated date
      if (cleanedAnswer && visitId) {
        try {
          db.prepare('UPDATE hospital_visits SET visit_date = ? WHERE id = ?').run(cleanedAnswer, visitId);
          if (reportId) {
            db.prepare('UPDATE medical_reports SET report_date = ? WHERE id = ?').run(cleanedAnswer, reportId);
          }
        } catch {}
      }
      nextStep = 'CONFIRM_HOSPITAL';
      nextPrompt = language === 'te'
        ? "మీరు ఏ ఆసుపత్రి లేదా డయాగ్నస్టిక్ ల్యాబ్‌లో ఈ పరీక్ష చేయించుకున్నారు? (ఉదా: అపోలో, యశోద, లేదా మీ ల్యాబ్)"
        : (language === 'hi'
        ? "आपने यह टेस्ट किस अस्पताल या डायग्नोस्टिक लैब में करवाया? (जैसे अपोलो, मैक्स, या अन्य लैब)"
        : "Which hospital or diagnostic laboratory did you visit for this test? (e.g. Apollo, Yashoda, or your local lab)");

    } else if (step === 'CONFIRM_HOSPITAL') {
      // Step 2: Confirmed Hospital
      if (cleanedAnswer && userId) {
        PatientKnowledgeService.upsertEntry(userId, {
          entryType: 'hospital',
          key: cleanedAnswer,
          title: cleanedAnswer,
          summary: `Visited for laboratory testing`,
          details: { name: cleanedAnswer, lastVisit: now.split('T')[0] }
        });
      }
      nextStep = 'CONFIRM_DOCTOR';
      nextPrompt = language === 'te'
        ? "ఈ పరీక్షను సూచించిన లేదా పరిశీలించిన కన్సల్టింగ్ డాక్టర్ గారి పేరు ఏమిటి?"
        : (language === 'hi'
        ? "इस टेस्ट की सलाह देने वाले डॉक्टर साहब का क्या नाम है?"
        : "What is the name of your consulting doctor who ordered or reviewed this test?");

    } else if (step === 'CONFIRM_DOCTOR') {
      // Step 3: Confirmed Doctor
      if (cleanedAnswer && userId) {
        PatientKnowledgeService.upsertEntry(userId, {
          entryType: 'doctor',
          key: cleanedAnswer,
          title: cleanedAnswer,
          summary: `Consulting physician for medical records`,
          details: { name: cleanedAnswer, lastConsulted: now.split('T')[0] }
        });
        if (visitId) {
          try {
            db.prepare('UPDATE hospital_visits SET physician_name = ? WHERE id = ?').run(cleanedAnswer, visitId);
          } catch {}
        }
      }
      nextStep = 'CONFIRM_CONTEXT';
      nextPrompt = language === 'te'
        ? "ఈ టెస్ట్ కి ముందు మీరు ఫాస్టింగ్ (ఉపవాసం) లో ఉన్నారా? లేదా జ్వరం, నీరసం వంటి ఏవైనా లక్షణాలు ఉన్నాయా?"
        : (language === 'hi'
        ? "क्या आप इस टेस्ट से पहले खाली पेट (फास्टिंग) थे? या बुखार, थकान जैसे कोई खास लक्षण थे?"
        : "Were you fasting for this test, or did you have any symptoms like fever, fatigue, or was it a routine health check?");

    } else if (step === 'CONFIRM_CONTEXT') {
      // Step 4: Confirmed Context / Symptoms
      completed = true;
      if (cleanedAnswer && userId) {
        PatientKnowledgeService.upsertEntry(userId, {
          entryType: 'visit_context',
          key: `visit_notes_${Date.now()}`,
          title: 'Patient Clinical Context',
          summary: cleanedAnswer,
          details: { notes: cleanedAnswer, date: now.split('T')[0] }
        });
      }
      nextStep = 'COMPLETED';
      nextPrompt = language === 'te'
        ? "చాలా ధన్యవాదాలు! మీ సమాధానాలన్నీ సురక్షితంగా రికార్డ్ చేయబడ్డాయి. ఇప్పుడు మీ రిపోర్ట్‌లోని ప్రతి అంశాన్ని సులభంగా అర్థమయ్యేలా చూద్దాం!"
        : (language === 'hi'
        ? "बहुत-बहुत धन्यवाद! आपके सभी उत्तर सुरक्षित रूप से दर्ज कर लिए गए हैं। अब आइए आपकी रिपोर्ट के सभी निष्कर्षों को आसान भाषा में समझें!"
        : "Thank you so much! All your details have been securely recorded. Now, let's explore everything in your report in simple, easy-to-understand terms!");
    }

    return {
      success: true,
      completed,
      step: nextStep,
      prompt: nextPrompt,
      spokenText: nextPrompt,
      language
    };
  }

  /**
   * Generates a context-aware, evidence-grounded conversational response
   */
  static async processConversationTurn({ userId = null, message = '', language = null, history = [], reportId = null }) {
    const cleanedMessage = (message || '').trim();
    if (!cleanedMessage) {
      throw new Error('Message text is required for voice conversation.');
    }

    // 1. Language determination: explicit or detected
    const selectedLang = language && ['te', 'en', 'hi'].includes(language)
      ? language
      : detectLanguage(cleanedMessage, 'en');

    // 2. Emergency triage check
    const emergencyTriage = checkEmergencyTriage(cleanedMessage);

    // 3. Check Upload / Scan Intent
    if (checkUploadIntent(cleanedMessage)) {
      const uploadPrompt = getUploadPromptResponse(selectedLang);
      return {
        success: true,
        query: cleanedMessage,
        language: selectedLang,
        locale: LANGUAGE_LOCALES[selectedLang],
        action: 'PROMPT_UPLOAD',
        answer: uploadPrompt.text,
        spokenText: uploadPrompt.text,
        sources: ['HealthCopilot Voice Guide'],
        followUps: uploadPrompt.followUps,
        isEmergency: false,
        medicalDisclaimer: this.getDisclaimer(selectedLang)
      };
    }

    // 4. User Medical Context & Knowledge Retrieval (if authenticated)
    let userReports = [];
    let focusedReport = null;
    let knowledgeProfile = null;

    if (userId) {
      try {
        if (reportId) {
          focusedReport = db.prepare(`
            SELECT r.*, v.visit_date as visitDate, h.name as hospitalName
            FROM medical_reports r
            LEFT JOIN hospital_visits v ON v.id = r.visit_id
            LEFT JOIN hospitals h ON h.id = v.hospital_id
            WHERE r.id = ? AND r.user_id = ?
          `).get(reportId, userId);
        }

        userReports = db.prepare(`
          SELECT r.id, r.title, r.category, r.report_date, r.ai_analysis_json,
                 v.visit_date as visitDate, h.name as hospitalName
          FROM medical_reports r
          LEFT JOIN hospital_visits v ON v.id = r.visit_id
          LEFT JOIN hospitals h ON h.id = v.hospital_id
          WHERE r.user_id = ?
          ORDER BY r.report_date DESC
          LIMIT 5
        `).all(userId);

        knowledgeProfile = PatientKnowledgeService.getPatientKnowledgeProfile(userId);

        // Grounded Continuity Check for "Why did my medicine change?"
        const pat = db.prepare('SELECT id FROM patients WHERE user_id = ? OR id = ?').get(userId, userId);
        if (pat) {
          const continuityAnswer = answerMedicineChangeQuery(pat.id, cleanedMessage);
          if (continuityAnswer) {
            return {
              success: true,
              query: cleanedMessage,
              language: selectedLang,
              locale: LANGUAGE_LOCALES[selectedLang],
              answer: continuityAnswer.text,
              spokenText: continuityAnswer.text,
              sources: ['HealthContinuum Clinical Records'],
              followUps: continuityAnswer.suggestedQuestions,
              isEmergency: false,
              medicalDisclaimer: this.getDisclaimer(selectedLang)
            };
          }
        }
      } catch (err) {
        console.warn('[VoiceService] Context lookup warning:', err.message);
      }
    }

    // Target report: explicitly focused or latest available
    const primaryReport = focusedReport || (userReports.length > 0 ? userReports[0] : null);

    // Extract clinical findings if available
    let primaryLabs = [];
    if (primaryReport && primaryReport.ai_analysis_json) {
      try {
        const parsed = JSON.parse(primaryReport.ai_analysis_json);
        primaryLabs = parsed.labResults || [];
      } catch {}
    }

    // 5. Generate Natural Conversational Response
    const conversationalResult = this.generateConversationalAnswer({
      query: cleanedMessage,
      language: selectedLang,
      history,
      report: primaryReport,
      labResults: primaryLabs,
      knowledgeProfile,
      emergencyTriage
    });

    // 6. Generate Simple Human Breakdown
    const simpleBreakdown = generateSimpleHumanBreakdown({
      report: primaryReport,
      labResults: primaryLabs,
      language: selectedLang
    });

    return {
      success: true,
      query: cleanedMessage,
      language: selectedLang,
      locale: LANGUAGE_LOCALES[selectedLang],
      answer: conversationalResult.text,
      spokenText: conversationalResult.spokenText || conversationalResult.text,
      sources: conversationalResult.sources,
      followUps: conversationalResult.followUps,
      isEmergency: Boolean(emergencyTriage),
      simpleBreakdown,
      medicalDisclaimer: this.getDisclaimer(selectedLang)
    };
  }

  /**
   * Internal generator for natural, patient-friendly medical explanation
   */
  static generateConversationalAnswer({ query, language, history, report, labResults, knowledgeProfile, emergencyTriage }) {
    const lower = query.toLowerCase();
    const sources = [];

    // Prepend emergency triage warning if detected
    let emergencyPrefix = '';
    if (emergencyTriage) {
      emergencyPrefix = emergencyTriage.guidance[language] + '\n\n';
    }

    if (report) {
      sources.push(`${report.title || 'Medical Report'} (${report.report_date || report.reportDate || 'Recent'}) — ${report.hospitalName || 'Laboratory'}`);
    }

    // Check query topics
    const mentionsHemoglobin = lower.includes('hemoglobin') || lower.includes('hb') || query.includes('హిమోగ్లోబిన్') || query.includes('हीमोग्लोबिन');
    const mentionsWbc = lower.includes('wbc') || lower.includes('white blood') || lower.includes('infection') || query.includes('తెల్ల రక్తకణాలు') || query.includes('श्वेत रक्त');
    const mentionsPlatelets = lower.includes('platelet') || query.includes('ప్లేట్‌లెట్') || query.includes('प्लेटलेट');
    const mentionsCholesterol = lower.includes('cholesterol') || lower.includes('lipid') || lower.includes('heart') || query.includes('కొలెస్ట్రాల్') || query.includes('कोलेस्ट्रॉल');
    const mentionsUrine = lower.includes('urine') || lower.includes('protein') || query.includes('యూరిన్') || query.includes('మూత్ర');
    const mentionsDoctorKnowledge = lower.includes('doctor') || query.includes('డాక్టర్') || query.includes('डॉक्टर');
    const mentionsHospitalKnowledge = lower.includes('hospital') || query.includes('ఆసుపత్రి') || query.includes('హాస్పిటల్') || query.includes('अस्पताल');
    const mentionsOverview = lower.includes('explain') || lower.includes('latest') || lower.includes('summary') || lower.includes('report') || lower.includes('results') ||
                             query.includes('రిపోర్ట్') || query.includes('వివరించండి') || query.includes('సారాంశం') || query.includes('रिपोर्ट') || query.includes('समझाएं');

    // Check Knowledge Base for Doctor / Hospital inquiries
    if (mentionsDoctorKnowledge && knowledgeProfile && knowledgeProfile.doctors.length > 0) {
      const docList = knowledgeProfile.doctors.map(d => d.name).join(', ');
      if (language === 'te') {
        return {
          text: `మీ హెల్త్ నాలెడ్జ్ బేస్ రికార్డుల ప్రకారం, మీరు సంప్రదించిన డాక్టర్: ${docList}.`,
          sources: ['Health Knowledge Base'],
          followUps: ['నా తాజా రిపోర్ట్ సారాంశం చెప్పండి', 'హిమోగ్లోబిన్ నార్మల్ గా ఉందా?']
        };
      } else if (language === 'hi') {
        return {
          text: `आपके हेल्थ नॉलेज बेस रिकॉर्ड के अनुसार, आपके परामर्शदाता डॉक्टर हैं: ${docList}।`,
          sources: ['Health Knowledge Base'],
          followUps: ['मेरी नवीनतम रिपोर्ट समझाएं', 'क्या मेरा हीमोग्लोबिन ठीक है?']
        };
      } else {
        return {
          text: `According to your personal health records, you have consulted: ${docList}.`,
          sources: ['Health Knowledge Base'],
          followUps: ['Explain my latest report', 'Is my hemoglobin normal?']
        };
      }
    }

    if (mentionsHospitalKnowledge && knowledgeProfile && knowledgeProfile.hospitals.length > 0) {
      const hospList = knowledgeProfile.hospitals.map(h => h.name).join(', ');
      if (language === 'te') {
        return {
          text: `మీ రికార్డులలో నమోదైన హాస్పిటల్స్/ల్యాబ్స్: ${hospList}.`,
          sources: ['Health Knowledge Base'],
          followUps: ['నా తాజా రిపోర్ట్ సారాంశం చెప్పండి', 'ప్లేట్‌లెట్ వివరాలు చెప్పండి']
        };
      } else if (language === 'hi') {
        return {
          text: `आपके रिकॉर्ड में दर्ज अस्पताल या लैब्स हैं: ${hospList}।`,
          sources: ['Health Knowledge Base'],
          followUps: ['मेरी नवीनतम रिपोर्ट समझाएं', 'प्लेटलेट्स की स्थिति क्या है?']
        };
      } else {
        return {
          text: `Your recorded medical facilities include: ${hospList}.`,
          sources: ['Health Knowledge Base'],
          followUps: ['Explain my latest report', 'Check my platelet count']
        };
      }
    }

    // Find analyte matches in real user findings
    const hbFinding = labResults.find(l => /hemoglobin|hb/i.test(l.name));
    const wbcFinding = labResults.find(l => /wbc|white blood/i.test(l.name));
    const pltFinding = labResults.find(l => /platelet/i.test(l.name));
    const cholFinding = labResults.find(l => /cholesterol/i.test(l.name));

    // A. Hemoglobin Query
    if (mentionsHemoglobin && hbFinding) {
      const val = hbFinding.numericValue ?? hbFinding.rawValue;
      const range = hbFinding.referenceRange?.rawRange || '14 - 18';
      const isNormal = hbFinding.status === 'NORMAL';

      if (language === 'te') {
        const statusText = isNormal ? 'సాధారణ పరిధిలోనే ఉంది' : 'పరిధికి వెలుపల ఉంది';
        return {
          text: `${emergencyPrefix}మీ తాజా రిపోర్ట్ ప్రకారం, మీ హిమోగ్లోబిన్ స్థాయి ${val} g/dL గా ఉంది. ల్యాబ్ రిఫరెన్స్ పరిధి ${range} g/dL కాబట్టి, ఇది ${statusText}. ఇది శరీరంలోని కణజాలాలకు ఆక్సిజన్ సరఫరా సమర్థవంతంగా సాగుతుందని సూచిస్తుంది.`,
          sources,
          followUps: ['నా WBC కౌంట్ ఎలా ఉంది?', 'ప్లేట్‌లెట్ వివరాలు చెప్పండి', 'ఈ రిపోర్ట్‌పై డాక్టర్‌ని ఏమి అడగాలి?']
        };
      } else if (language === 'hi') {
        const statusText = isNormal ? 'सामान्य सीमा के भीतर है' : 'सामान्य सीमा से बाहर है';
        return {
          text: `${emergencyPrefix}आपकी नवीनतम रिपोर्ट के अनुसार, आपका हीमोग्लोबिन स्तर ${val} g/dL है। प्रयोगशाला की संदर्भ सीमा ${range} g/dL है, अतः यह ${statusText}। यह दर्शाता है कि आपकी लाल रक्त कोशिकाएं और ऑक्सीजन संचरण अच्छी स्थिति में हैं।`,
          sources,
          followUps: ['मेरा WBC काउंट कैसा है?', 'प्लेटलेट्स की स्थिति क्या है?', 'डॉक्टर से क्या पूछना चाहिए?']
        };
      } else {
        const statusText = isNormal ? 'well within the healthy reference range' : 'outside the stated reference range';
        return {
          text: `${emergencyPrefix}According to your latest laboratory report, your Hemoglobin is ${val} g/dL against a reference interval of ${range} g/dL, which is ${statusText}. This indicates healthy oxygen-carrying capacity in your blood cells.`,
          sources,
          followUps: ['How is my WBC count?', 'Explain my platelet count', 'What should I ask my doctor about this?']
        };
      }
    }

    // B. WBC Count Query
    if (mentionsWbc && wbcFinding) {
      const val = wbcFinding.rawValue || wbcFinding.numericValue;
      const range = wbcFinding.referenceRange?.rawRange || '4,000 - 10,000';
      const isElevated = wbcFinding.status === 'HIGH';

      if (language === 'te') {
        const detail = isElevated
          ? `మీ WBC కౌంట్ ${val} /mm³ గా ఉంది, ఇది సాధారణ పరిధి (${range}) కంటే కొద్దిగా ఎక్కువగా ఉంది. సాధారణంగా స్వల్ప ఇన్ఫెక్షన్, అలెర్జీ లేదా శారీరక ఒత్తిడి వల్ల ఇది తాత్కాలికంగా పెరగవచ్చు. ఆందోళన చెందకుండా మీ వైద్యునితో సంప్రదించండి.`
          : `మీ WBC కౌంట్ ${val} /mm³ గా ఉంది. ఇది సాధారణ పరిధి (${range}) లో ఉండి, ఆరోగ్యకరమైన రోగనిరోధక శక్తిని తెలియజేస్తుంది.`;
        return {
          text: emergencyPrefix + detail,
          sources,
          followUps: ['దీని నివారణకు ఆహార నియమాలు ఏమిటి?', 'హిమోగ్లోబిన్ స్థాయి సాధారణంగా ఉందా?', 'తదుపరి టెస్ట్ ఎప్పుడు చేయించుకోవాలి?']
        };
      } else if (language === 'hi') {
        const detail = isElevated
          ? `आपकी WBC संख्या ${val} /mm³ है, जो सामान्य सीमा (${range}) से थोड़ी अधिक है। ऐसा अक्सर किसी हल्के संक्रमण, एलर्जी या शारीरिक तनाव के कारण हो सकता है। यह कोई बीमारी की निश्चित पुष्टि नहीं है, कृपया नियमित जांच के दौरान डॉक्टर से परामर्श लें।`
          : `आपकी WBC संख्या ${val} /mm³ है, जो सामान्य संदर्भ सीमा (${range}) के भीतर है। यह एक स्वस्थ प्रतिरक्षा प्रणाली का संकेत है।`;
        return {
          text: emergencyPrefix + detail,
          sources,
          followUps: ['क्या हीमोग्लोबिन सामान्य है?', 'प्लेटलेट्स की क्या स्थिति है?', 'मुझे डॉक्टर से क्या चर्चा करनी चाहिए?']
        };
      } else {
        const detail = isElevated
          ? `Your WBC count is recorded at ${val} /mm³, which is slightly elevated compared to the laboratory range of ${range} /mm³. Mild elevations often reflect a natural immune response to a minor allergy, recovery from cold, or recent stress. Discuss this with your doctor during your next visit.`
          : `Your WBC count is ${val} /mm³, securely within the healthy reference range of ${range} /mm³, reflecting steady immune defenses.`;
        return {
          text: emergencyPrefix + detail,
          sources,
          followUps: ['Why does WBC fluctuate?', 'Check my hemoglobin level', 'Questions for my doctor']
        };
      }
    }

    // C. Platelets Query
    if (mentionsPlatelets && pltFinding) {
      const val = pltFinding.rawValue || pltFinding.numericValue;
      const range = pltFinding.referenceRange?.rawRange || '140,000 - 450,000';

      if (language === 'te') {
        return {
          text: `${emergencyPrefix}మీ ప్లేట్‌లెట్ కౌంట్ ${val} /mm³ గా నమోదైంది. ఇది సాధారణ ల్యాబ్ పరిధి ${range} /mm³ లోనే ఉంది. రక్తం గడ్డకట్టే సామర్థ్యం సమతుల్యంగా ఉంది.`,
          sources,
          followUps: ['మొత్తం రిపోర్ట్ సారాంశం చెప్పండి', 'హిమోగ్లోబిన్ నార్మల్ గా ఉందా?']
        };
      } else if (language === 'hi') {
        return {
          text: `${emergencyPrefix}आपकी प्लेटलेट संख्या ${val} /mm³ है। यह सामान्य सीमा ${range} /mm³ के भीतर है, जो रक्त के उचित थक्के जमने की प्रक्रिया के लिए पूरी तरह अनुकूल है।`,
          sources,
          followUps: ['पूरी रिपोर्ट का सारांश दें', 'क्या मेरा हीमोग्लोबिन ठीक है?']
        };
      } else {
        return {
          text: `${emergencyPrefix}Your platelet count is ${val} /mm³, securely within the standard clinical interval of ${range} /mm³. This supports healthy blood clotting function.`,
          sources,
          followUps: ['Give me an overall report summary', 'Check my WBC count']
        };
      }
    }

    // D. General Report Overview / Explanation
    if (mentionsOverview && report && labResults.length > 0) {
      const total = labResults.length;
      const outside = labResults.filter(l => l.status === 'HIGH' || l.status === 'LOW');
      const inside = labResults.filter(l => l.status === 'NORMAL');

      if (language === 'te') {
        return {
          text: `${emergencyPrefix}మీ ${report.title || 'తాజా రిపోర్ట్'} లో మొత్తం ${total} పరీక్షలను పరిశీలించాము. ఇందులో ${inside.length} పరీక్షలు పూర్తిగా సాధారణ పరిధిలో ఉన్నాయి.${outside.length > 0 ? ` కేవలం ${outside.map(o => o.name).join(', ')} మాత్రమే కొద్దిగా పరిధి వెలుపల ఉన్నాయి.` : ' అన్ని ముఖ్యమైన పారామితులు సాధారణంగా ఉన్నాయి.'} మీ వైద్యునితో సమీక్షించేందుకు పూర్తి వివరాలు సిద్ధంగా ఉన్నాయి.`,
          sources,
          followUps: ['హిమోగ్లోబిన్ వివరాలు చెప్పండి', 'WBC కౌంట్ గురించి వివరించండి', 'డాక్టర్‌ను అడగవలసిన ప్రశ్నలు ఏమిటి?']
        };
      } else if (language === 'hi') {
        return {
          text: `${emergencyPrefix}आपकी ${report.title || 'हालिया रिपोर्ट'} में कुल ${total} परीक्षणों का मूल्यांकन किया गया। इनमें से ${inside.length} पैरामीटर पूरी तरह सामान्य सीमा में हैं।${outside.length > 0 ? ` केवल ${outside.map(o => o.name).join(', ')} मान में हल्का बदलाव देखा गया है।` : ' सभी प्रमुख संकेतक स्वस्थ स्थिति में हैं।'} विस्तृत सलाह के लिए अपने चिकित्सक से संपर्क करें।`,
          sources,
          followUps: ['हीमोग्लोबिन के बारे में बताएं', 'WBC संख्या का क्या अर्थ है?', 'डॉक्टर से क्या पूछें?']
        };
      } else {
        return {
          text: `${emergencyPrefix}In your latest ${report.title || 'medical report'}, ${total} clinical parameters were analyzed. ${inside.length} reside safely within reference ranges.${outside.length > 0 ? ` ${outside.map(o => `${o.name} (${o.rawValue || o.numericValue})`).join(', ')} is flagged outside standard bounds.` : ' All key biomarkers demonstrate stable physiological health.'} Feel free to ask about any specific test.`,
          sources,
          followUps: ['Is my hemoglobin normal?', 'Why is my WBC count flagged?', 'What questions should I ask my doctor?']
        };
      }
    }

    // E. General Friendly Conversational Fallback
    if (language === 'te') {
      return {
        text: `${emergencyPrefix}నేను మీ హెల్త్ కాపీలట్ అసిస్టెంట్ని. మీ రక్త పరీక్షలు (CBC), యూరిన్ రిపోర్టులు, లేదా సాధారణ ఆరోగ్య ప్రశ్నల గురించి మీరు అడగవచ్చు. లేదా "డాక్యుమెంట్ అప్‌లోడ్ చేయండి" అని చెబితే కొత్త రిపోర్ట్ స్కాన్ చేసుకోవచ్చు.`,
        sources,
        followUps: ['నా తాజా రిపోర్ట్ వివరించండి', 'డాక్యుమెంట్ అప్‌లోడ్ చేయాలి', 'హిమోగ్లోబిన్ నార్మల్ గా ఉందా?']
      };
    } else if (language === 'hi') {
      return {
        text: `${emergencyPrefix}मैं आपका हेल्थ कॉपायलट सहायक हूँ। आप अपनी हालिया सीबीसी (CBC), मूत्र परीक्षण रिपोर्ट या सामान्य स्वास्थ्य प्रश्नों के बारे में पूछ सकते हैं। आप "रिपोर्ट अपलोड करें" कहकर नया दस्तावेज़ भी स्कैन कर सकते हैं।`,
        sources,
        followUps: ['मेरी नवीनतम रिपोर्ट समझाएं', 'दस्तावेज़ अपलोड करना है', 'क्या मेरा हीमोग्लोबिन ठीक है?']
      };
    } else {
      return {
        text: `${emergencyPrefix}I am your HealthCopilot voice assistant. You can ask me about your recent laboratory reports, complete blood count (CBC), or general wellness indicators. You can also say "Upload document" to scan or add a new lab report!`,
        sources,
        followUps: ['Explain my latest report', 'I want to upload a document', 'Is my hemoglobin normal?']
      };
    }
  }

  static getDisclaimer(language = 'en') {
    if (language === 'te') {
      return 'గమనిక: ఈ అసిస్టెంట్ కేవలం సమాచార ప్రయోజనాల కోసం మాత్రమే. ఇది వైద్య నిర్ధారణ లేదా చికిత్స కాదు. ఏదైనా ఆరోగ్య నిర్ణయానికి ముందు దయచేసి అర్హతగల వైద్యుడిని సంప్రదించండి.';
    }
    if (language === 'hi') {
      return 'सूचना: यह सहायक केवल सामान्य स्वास्थ्य जानकारी प्रदान करता है, कोई चिकित्सकीय निदान नहीं। किसी भी चिकित्सीय निर्णय के लिए कृपया योग्य डॉक्टर से परामर्श लें।';
    }
    return 'Notice: This voice assistant provides educational health summaries and does not offer a medical diagnosis. Always consult a qualified physician for clinical care.';
  }
}
