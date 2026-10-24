import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { SUPPORTED_LANGUAGES } from '../utils/voiceAssistantEngine';

const SAMPLE_PROMPTS = {
  te: [
    "📄 నా రిపోర్ట్ అప్‌లోడ్ చేయాలి",
    "నా తాజా CBC రిపోర్ట్ వివరించండి",
    "నా హిమోగ్లోబిన్ నార్మల్ గా ఉందా?",
    "నా గత డాక్టర్ మరియు ఆసుపత్రి వివరాలు ఏమిటి?",
    "WBC కౌంట్ గురించి చెప్పండి"
  ],
  hi: [
    "📄 मेरी रिपोर्ट अपलोड करें",
    "मेरी नवीनतम रिपोर्ट समझाएं",
    "क्या मेरा हीमोग्लोबिन सामान्य है?",
    "मेरे डॉक्टर और अस्पताल का रिकॉर्ड क्या है?",
    "WBC संख्या क्यों बढ़ी है?"
  ],
  en: [
    "📄 I want to upload a document",
    "Explain my latest report in simple words",
    "Is my hemoglobin count normal?",
    "Who is my recorded doctor & hospital?",
    "What do these results mean for me?"
  ]
};

const PLACEHOLDERS = {
  te: "మీ ప్రశ్న వినడానికి సిద్ధంగా ఉన్నాను... లేదా 'రిపోర్ట్ అప్‌లోడ్ చేయండి' అని చెప్పండి",
  hi: "आपकी आवाज़ सुनने की प्रतीक्षा कर रहा हूँ... या 'रिपोर्ट अपलोड करें' कहें",
  en: "Listening for your voice... or say 'I want to upload a document'"
};

export const VoiceProcessingScreen = () => {
  const {
    askAI,
    navigateTo,
    stopSpeaking,
    voiceLanguage,
    setVoiceLanguage,
    playVoiceGreeting,
    voiceState,
    voiceInterview,
    handleVoiceUploadDocument,
    submitVoiceInterviewAnswer,
    knowledgeProfile,
    fetchKnowledgeProfile
  } = useApp();

  const [transcribedText, setTranscribedText] = useState(PLACEHOLDERS[voiceLanguage] || PLACEHOLDERS.en);
  const [isMicActive, setIsMicActive] = useState(false);
  const [showUploadPicker, setShowUploadPicker] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [customAnswer, setCustomAnswer] = useState('');
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Play greeting once on initial screen entry
  useEffect(() => {
    playVoiceGreeting(voiceLanguage);
    fetchKnowledgeProfile();
  }, []);

  // Update placeholder on language change
  useEffect(() => {
    setTranscribedText(PLACEHOLDERS[voiceLanguage] || PLACEHOLDERS.en);
  }, [voiceLanguage]);

  // Speech Recognition lifecycle bound to voiceLanguage
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === voiceLanguage);
      recognition.lang = langConfig ? langConfig.locale : 'en-IN';

      recognition.onstart = () => {
        setIsMicActive(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        if (transcript.trim()) {
          setTranscribedText(transcript);

          // If in interview mode, user voice answer can be routed to current question
          if (voiceInterview.isActive && voiceInterview.step) {
            setCustomAnswer(transcript);
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('[SpeechRecognition] error:', e.error);
        setIsMicActive(false);
      };

      recognition.onend = () => {
        setIsMicActive(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error', err);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [voiceLanguage, voiceInterview.step]);

  const handleLanguageSwitch = (langCode) => {
    stopSpeaking();
    setVoiceLanguage(langCode);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const handleSimulateQuestion = (q) => {
    stopSpeaking();
    const cleanQ = q.replace(/^📄\s*/, '');
    setTranscribedText(cleanQ);

    if (cleanQ.includes('అప్‌లోడ్') || cleanQ.includes('अपलोड') || cleanQ.toLowerCase().includes('upload')) {
      setShowUploadPicker(true);
    }

    setTimeout(() => {
      askAI(cleanQ, voiceLanguage);
    }, 250);
  };

  const handleFinishSpeaking = () => {
    stopSpeaking();
    const isPlaceholder = Object.values(PLACEHOLDERS).includes(transcribedText);
    const finalQuery = (!isPlaceholder && transcribedText.trim())
      ? transcribedText.trim()
      : (SAMPLE_PROMPTS[voiceLanguage]?.[1] || "Explain my latest report");

    const lower = finalQuery.toLowerCase();
    if (lower.includes('upload') || lower.includes('scan') || finalQuery.includes('అప్‌లోడ్') || finalQuery.includes('अपलोड')) {
      setShowUploadPicker(true);
    }

    askAI(finalQuery, voiceLanguage);
  };

  // Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowUploadPicker(false);
      handleVoiceUploadDocument(file);
    }
  };

  const handleSampleCbcUpload = () => {
    setShowUploadPicker(false);
    const sampleBlob = new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'], { type: 'application/pdf' });
    const sampleFile = new File([sampleBlob], 'Complete_Blood_Count_Sample.pdf', { type: 'application/pdf' });
    handleVoiceUploadDocument(sampleFile);
  };

  const handleCaptureCameraSnapshot = () => {
    setIsCameraActive(false);
    setShowUploadPicker(false);
    const sampleBlob = new Blob(['sample-camera-image-data'], { type: 'image/jpeg' });
    const cameraFile = new File([sampleBlob], `Lab_Camera_Scan_${Date.now().toString().slice(-4)}.jpg`, { type: 'image/jpeg' });
    handleVoiceUploadDocument(cameraFile);
  };

  const prompts = SAMPLE_PROMPTS[voiceLanguage] || SAMPLE_PROMPTS.en;

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#F0FDFB] via-[#E6F8F5] to-white px-5 pt-4 pb-6 select-none min-h-[720px] text-center relative">
      <div>
        <Header
          title="Health AI Voice"
          showBack={true}
          onBack={() => {
            stopSpeaking();
            navigateTo('home', 'home');
          }}
        />

        {/* Top Controls: Multilingual Selector & Knowledge Base Trigger */}
        <div className="flex items-center justify-between gap-1.5 mt-2 px-1">
          <div className="flex items-center gap-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = voiceLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSwitch(lang.code)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md scale-105'
                      : 'bg-white/90 text-slate-600 border border-teal-100 hover:bg-white'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowKnowledgeModal(true)}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100/80 hover:bg-teal-200 text-teal-800 border border-teal-200 transition flex items-center gap-1 shadow-2xs"
          >
            <span>🧠</span>
            <span>
              {voiceLanguage === 'te' ? 'హెల్త్ మెమరీ' : (voiceLanguage === 'hi' ? 'स्वास्थ्य रिकॉर्ड' : 'Health Memory')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        {/* ======================================================== */}
        {/* MODE 1: INTERACTIVE VOICE INTERVIEW (POST-UPLOAD)         */}
        {/* ======================================================== */}
        {voiceInterview.isActive && (
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 border border-teal-200 shadow-xl space-y-3.5 animate-in fade-in duration-300">
            {/* Step Header */}
            <div className="flex items-center justify-between pb-2 border-b border-teal-50">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                {voiceLanguage === 'te' ? 'రిపోర్ట్ వివరాల నిర్ధారణ' : (voiceLanguage === 'hi' ? 'रिपोर्ट विवरण सत्यापन' : 'Voice Report Verification')}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {voiceInterview.step === 'CONFIRM_DATE' ? 'Step 1 of 4'
                  : voiceInterview.step === 'CONFIRM_HOSPITAL' ? 'Step 2 of 4'
                  : voiceInterview.step === 'CONFIRM_DOCTOR' ? 'Step 3 of 4'
                  : 'Step 4 of 4'}
              </span>
            </div>

            {/* Speaking Prompt Card */}
            <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-100 text-left space-y-1">
              <span className="text-[10px] font-bold text-teal-800 uppercase flex items-center gap-1">
                <span>🔊 AI Assistant</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                "{voiceInterview.prompt}"
              </p>
            </div>

            {/* Quick Answer Options According to Step */}
            {voiceInterview.step === 'CONFIRM_DATE' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => submitVoiceInterviewAnswer(voiceInterview.answers.date || '2026-10-15')}
                    className="py-2.5 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-soft transition text-center"
                  >
                    ✓ {voiceLanguage === 'te' ? 'అవును, ఇదే తేదీ' : (voiceLanguage === 'hi' ? 'हाँ, यही तारीख है' : 'Yes, exact date')}
                  </button>
                  <button
                    onClick={() => submitVoiceInterviewAnswer(new Date().toISOString().split('T')[0])}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition text-center"
                  >
                    🗓️ {voiceLanguage === 'te' ? 'ఈరోజే జరిగింది' : (voiceLanguage === 'hi' ? 'आज का है' : 'Today')}
                  </button>
                </div>
              </div>
            )}

            {voiceInterview.step === 'CONFIRM_HOSPITAL' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block text-left">
                  {voiceLanguage === 'te' ? 'సూచించిన ఆసుపత్రులు:' : (voiceLanguage === 'hi' ? 'सुझाए गए अस्पताल:' : 'Suggested facilities:')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Apollo Hospital', 'Yashoda Hospitals', 'Care Hospital', 'Vijaya Diagnostic'].map(h => (
                    <button
                      key={h}
                      onClick={() => submitVoiceInterviewAnswer(h)}
                      className="py-2 px-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-medium transition text-left"
                    >
                      🏥 {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceInterview.step === 'CONFIRM_DOCTOR' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block text-left">
                  {voiceLanguage === 'te' ? 'డాక్టర్ పేరును ఎంచుకోండి లేదా చెప్పండి:' : (voiceLanguage === 'hi' ? 'डॉक्टर का नाम चुनें या बोलें:' : 'Choose or speak doctor name:')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Dr. Suresh Reddy', 'Dr. Sarah Jenkins', 'Dr. Marcus Brody', 'Self-Referred / Other'].map(d => (
                    <button
                      key={d}
                      onClick={() => submitVoiceInterviewAnswer(d)}
                      className="py-2 px-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-medium transition text-left"
                    >
                      👨‍⚕️ {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {voiceInterview.step === 'CONFIRM_CONTEXT' && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block text-left">
                  {voiceLanguage === 'te' ? 'టెస్ట్ సందర్భం / లక్షణాలు:' : (voiceLanguage === 'hi' ? 'परीक्षण का कारण / लक्षण:' : 'Reason / Symptoms:')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Fasting (ఉపవాసం)', val: 'Fasting test' },
                    { label: 'Routine Checkup', val: 'Routine wellness checkup' },
                    { label: 'Fever / Weakness', val: 'Mild fever and fatigue' },
                    { label: 'Follow-up Visit', val: 'Physician follow-up review' }
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => submitVoiceInterviewAnswer(item.val)}
                      className="py-2 px-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-medium transition text-left"
                    >
                      🩺 {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Voice/Text Input for Interview */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
              <input
                type="text"
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder={voiceLanguage === 'te' ? 'సమాధానం టైప్ చేయండి లేదా మాట్లాడండి...' : (voiceLanguage === 'hi' ? 'उत्तर टाइप करें या बोलें...' : 'Type or speak your answer...')}
                className="flex-1 py-2 px-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                disabled={!customAnswer.trim()}
                onClick={() => {
                  submitVoiceInterviewAnswer(customAnswer.trim());
                  setCustomAnswer('');
                }}
                className="p-2 bg-brand-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-2xs"
              >
                ➔
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: STANDARD LISTENING & UPLOAD PROMPTS               */}
        {/* ======================================================== */}
        {!voiceInterview.isActive && (
          <>
            {/* Animated Listening Wave Circle */}
            <div className="relative mb-5 mt-1">
              <div className="w-28 h-28 rounded-full bg-brand-500/10 border-4 border-brand-500/20 flex items-center justify-center relative">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 ${voiceState.isSpeaking ? 'animate-pulse' : ''}`}>
                  <svg className="w-9 h-9 fill-none stroke-white stroke-2" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-4 0h8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="absolute inset-0 rounded-full border-2 border-brand-500/50 animate-ping"></span>
              </div>
            </div>

            {/* Audio Waveforms */}
            <div className="flex items-center space-x-1.5 h-6 mb-2">
              <div className="w-1.5 bg-brand-500 rounded-full animate-soundwave-1"></div>
              <div className="w-1.5 bg-teal-400 rounded-full animate-soundwave-2"></div>
              <div className="w-1.5 bg-brand-600 rounded-full animate-soundwave-3"></div>
              <div className="w-1.5 bg-sky-500 rounded-full animate-soundwave-4"></div>
              <div className="w-1.5 bg-brand-500 rounded-full animate-soundwave-5"></div>
              <div className="w-1.5 bg-teal-300 rounded-full animate-soundwave-2"></div>
            </div>

            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {voiceState.isSpeaking
                ? (voiceLanguage === 'te' ? 'సహాయకుడు మాట్లాడుతున్నారు...' : (voiceLanguage === 'hi' ? 'असिस्टेंट बोल रहा है...' : 'Assistant is speaking...'))
                : (voiceLanguage === 'te' ? 'వింటున్నాము...' : (voiceLanguage === 'hi' ? 'सुन रहा हूँ...' : 'Listening...'))}
            </h2>

            {/* Live Transcription Bubble */}
            <p className="text-xs text-slate-700 mt-2 max-w-[300px] bg-white/95 p-3 rounded-2xl border border-teal-100 shadow-2xs leading-relaxed font-medium">
              "{transcribedText}"
            </p>

            {/* Prominent Quick "Scan or Upload" Action Card */}
            <div className="w-full max-w-[300px] mt-3">
              <button
                onClick={() => setShowUploadPicker(true)}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-500/20 transition flex items-center justify-between group active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📸</span>
                  <div className="text-left">
                    <span className="block leading-tight">
                      {voiceLanguage === 'te' ? 'ల్యాబ్ రిపోర్ట్ అప్‌లోడ్ / స్కాన్' : (voiceLanguage === 'hi' ? 'रिपोर्ट स्कैन या अपलोड करें' : 'Scan or Upload Report')}
                    </span>
                    <span className="text-[10px] text-teal-100 font-normal">
                      {voiceLanguage === 'te' ? 'కెమెరా లేదా PDF ఎంచుకోండి' : (voiceLanguage === 'hi' ? 'कैमरा या PDF चुनें' : 'Camera or PDF')}
                    </span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">➔</span>
              </button>
            </div>

            {/* Multilingual Sample Prompts */}
            <div className="w-full max-w-[310px] mt-3 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider text-left">
                {voiceLanguage === 'te' ? 'లేదా అడగండి:' : (voiceLanguage === 'hi' ? 'या यह पूछें:' : 'Or tap to ask:')}
              </span>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                {prompts.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSimulateQuestion(q)}
                    className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium rounded-xl border border-slate-200/80 shadow-2xs transition text-left truncate"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden File Input for Real Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Action Buttons Footer */}
      {!voiceInterview.isActive && (
        <div className="w-full pt-1 flex flex-col gap-2">
          <button
            onClick={handleFinishSpeaking}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-soft transition flex items-center justify-center gap-1.5"
          >
            <span>✨</span>
            <span>
              {voiceLanguage === 'te' ? 'మాట్లాడటం పూర్తయింది → సమాధానం పొందండి' : (voiceLanguage === 'hi' ? 'बोलना पूरा हुआ → उत्तर प्राप्त करें' : 'Finished Speaking → Generate Answer')}
            </span>
          </button>

          {voiceState.isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
            >
              ⏹️ {voiceLanguage === 'te' ? 'వాయిస్ ఆపండి' : (voiceLanguage === 'hi' ? 'आवाज़ बंद करें' : 'Stop Speaking')}
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SCAN OR UPLOAD DRAWER MODAL                     */}
      {/* ======================================================== */}
      {showUploadPicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {voiceLanguage === 'te' ? 'రిపోర్ట్‌ను స్కాన్ లేదా అప్‌లోడ్ చేయండి' : (voiceLanguage === 'hi' ? 'रिपोर्ट स्कैन या अपलोड करें' : 'Scan or Upload Report')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {voiceLanguage === 'te' ? 'మీకు అనుకూలమైన పద్ధతిని ఎంచుకోండి' : (voiceLanguage === 'hi' ? 'अपनी सुविधानुसार विकल्प चुनें' : 'Choose your preferred method')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Camera Scanner */}
              <button
                onClick={() => {
                  setShowUploadPicker(false);
                  setIsCameraActive(true);
                }}
                className="w-full p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border border-teal-200 rounded-2xl flex items-center gap-3 text-left transition group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-lg shadow-sm">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                    {voiceLanguage === 'te' ? 'కెమెరాతో స్కాన్ చేయండి' : (voiceLanguage === 'hi' ? 'कैमरे से स्कैन करें' : 'Scan with Camera')}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {voiceLanguage === 'te' ? 'రిపోర్ట్ ఫోటో తీసి వెంటనే చదవండి' : (voiceLanguage === 'hi' ? 'कागज़ की फोटो खींचकर तुरंत पढ़ें' : 'Take a clear photo of physical paper')}
                  </p>
                </div>
              </button>

              {/* Option 2: Choose File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 text-left transition group active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center text-lg shadow-sm">
                  📁
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {voiceLanguage === 'te' ? 'PDF లేదా ఫోటో అప్‌లోడ్' : (voiceLanguage === 'hi' ? 'PDF या फोटो अपलोड करें' : 'Upload PDF or Photo')}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {voiceLanguage === 'te' ? 'మీ పరికరం నుండి ఫైల్ ఎంచుకోండి' : (voiceLanguage === 'hi' ? 'डिवाइस से फ़ाइल चुनें' : 'Select medical file from device')}
                  </p>
                </div>
              </button>

              {/* Option 3: Instant 1-Click Sample */}
              <button
                onClick={handleSampleCbcUpload}
                className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-between text-left transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-[11px] font-bold text-amber-900">
                    {voiceLanguage === 'te' ? 'శాంపిల్ CBC రిపోర్ట్ తో ప్రయత్నించండి' : (voiceLanguage === 'hi' ? 'सैंपल CBC रिपोर्ट से आज़माएं' : 'Try with Sample CBC Lab Report')}
                  </span>
                </div>
                <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold text-amber-900">Instant</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CAMERA CAPTURE PREVIEW SIMULATOR                */}
      {/* ======================================================== */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-between p-6 z-50 animate-in fade-in">
          <div className="w-full flex items-center justify-between text-white">
            <span className="text-xs font-bold">📸 Document Scanner</span>
            <button
              onClick={() => setIsCameraActive(false)}
              className="text-white text-sm bg-white/20 p-2 rounded-full"
            >
              ✕
            </button>
          </div>

          <div className="w-full max-w-xs h-80 rounded-2xl border-2 border-dashed border-teal-400 bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-3xl mb-3 animate-pulse">
              📄
            </div>
            <p className="text-xs text-teal-100 font-medium">
              {voiceLanguage === 'te' ? 'రిపోర్ట్‌ను ఫ్రేమ్‌లో సమానంగా ఉంచండి' : (voiceLanguage === 'hi' ? 'रिपोर्ट को फ्रेम के बीच में रखें' : 'Align medical report inside frame')}
            </p>
            <span className="text-[10px] text-slate-400 mt-1">Lighting is clear • Ready to scan</span>
          </div>

          <button
            onClick={handleCaptureCameraSnapshot}
            className="w-16 h-16 rounded-full bg-white border-4 border-teal-500 shadow-2xl flex items-center justify-center active:scale-90 transition"
          >
            <div className="w-11 h-11 rounded-full bg-teal-500"></div>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PATIENT KNOWLEDGE BASE PROFILE                  */}
      {/* ======================================================== */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl max-h-[85vh] flex flex-col text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {voiceLanguage === 'te' ? 'నా పర్సనల్ హెల్త్ మెమరీ' : (voiceLanguage === 'hi' ? 'मेरा व्यक्तिगत स्वास्थ्य रिकॉर्ड' : 'Personal Health Knowledge Base')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {knowledgeProfile?.totalEntries || 0} items stored across visits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {/* Recorded Doctors */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">
                  👨‍⚕️ Consulting Doctors
                </span>
                {knowledgeProfile?.doctors?.length > 0 ? (
                  <div className="space-y-1">
                    {knowledgeProfile.doctors.map(d => (
                      <div key={d.name} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="text-[10px] text-teal-700 font-medium">{d.details?.hospital || 'Clinic'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No doctors recorded yet.</p>
                )}
              </div>

              {/* Recorded Hospitals */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">
                  🏥 Diagnostic Facilities & Hospitals
                </span>
                {knowledgeProfile?.hospitals?.length > 0 ? (
                  <div className="space-y-1">
                    {knowledgeProfile.hospitals.map(h => (
                      <div key={h.name} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{h.name}</span>
                        <span className="text-[10px] text-slate-400">{h.details?.lastVisit || 'Recent'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No facilities recorded yet.</p>
                )}
              </div>

              {/* Tracked Biomarkers History */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">
                  📈 Tracked Biomarkers & History
                </span>
                {knowledgeProfile?.biomarkers?.length > 0 ? (
                  <div className="space-y-1.5">
                    {knowledgeProfile.biomarkers.map(b => (
                      <div key={b.name} className="p-2 bg-teal-50/70 rounded-xl border border-teal-100 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900 block">{b.name}</span>
                          <span className="text-[10px] text-slate-500">{b.summary}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.latest?.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {b.latest?.status || 'NORMAL'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Upload your first report to start tracking your biomarkers over time.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowKnowledgeModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
