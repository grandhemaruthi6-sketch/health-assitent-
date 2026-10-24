import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { SUPPORTED_LANGUAGES } from '../utils/voiceAssistantEngine';

export const VoiceAnswerScreen = () => {
  const {
    voiceState,
    stopSpeaking,
    askAI,
    navigateTo,
    voiceLanguage,
    setVoiceLanguage,
    handleVoiceUploadDocument
  } = useApp();

  const [followUpInput, setFollowUpInput] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'simple_breakdown'

  const answer = voiceState.answer || {
    question: "Explain my latest report",
    answer: "Your latest laboratory findings reflect stable health parameters. Hemoglobin is healthy and metabolic indicators reside within desired ranges. Always discuss individual health plans with your physician.",
    sources: ["HealthCopilot Unified Records"],
    followUps: ["Is my hemoglobin count normal?", "Why is my WBC count slightly elevated?"],
    disclaimer: "Notice: This assistant provides educational health summaries and does not offer a medical diagnosis."
  };

  const handleAskFollowUp = (e) => {
    e.preventDefault();
    if (!followUpInput.trim()) return;
    askAI(followUpInput.trim(), voiceLanguage);
    setFollowUpInput('');
  };

  const handleLanguageSwitch = (langCode) => {
    stopSpeaking();
    setVoiceLanguage(langCode);
    const query = voiceState.query || answer.question;
    if (query) {
      askAI(query, langCode);
    }
  };

  const handleTriggerUpload = () => {
    stopSpeaking();
    navigateTo('voice_processing');
  };

  const followUps = (answer.followUps && answer.followUps.length > 0)
    ? answer.followUps
    : (voiceLanguage === 'te'
      ? ["నా హిమోగ్లోబిన్ నార్మల్ గా ఉందా?", "WBC కౌంట్ గురించి చెప్పండి", "మొత్తం రిపోర్ట్ సారాంశం"]
      : (voiceLanguage === 'hi'
      ? ["क्या मेरा हीमोग्लोबिन ठीक है?", "WBC संख्या कैसी है?", "पूरी रिपोर्ट का सारांश दें"]
      : ["Is my hemoglobin normal?", "Why is my WBC count slightly elevated?", "Show my report summary"]));

  const breakdown = answer.simpleBreakdown;

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#F8FAFC] pb-4 select-none min-h-[720px]">
      <div>
        <Header
          title="AI Voice Assistant"
          showBack={true}
          onBack={() => {
            stopSpeaking();
            navigateTo('home', 'home');
          }}
        />

        {/* Multilingual Selector Chips */}
        <div className="flex items-center justify-center gap-1.5 px-4 pt-1 pb-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = voiceLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSwitch(lang.code)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md scale-105'
                    : 'bg-white text-slate-600 border border-teal-100 hover:bg-slate-50'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-5 pt-1 space-y-3.5 max-h-[500px]">
        {/* Multi-turn history (if more than 1 turn exists) */}
        {voiceState.history && voiceState.history.length > 2 && (
          <div className="space-y-2 opacity-75 pb-2 border-b border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Recent Conversation
            </span>
            {voiceState.history.slice(-4, -2).map((item, idx) => (
              <div key={idx} className={`text-xs ${item.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-xl text-[11px] ${
                  item.role === 'user' ? 'bg-slate-200 text-slate-800' : 'bg-teal-50 text-teal-900 border border-teal-100'
                }`}>
                  {item.content}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* User Question Bubble */}
        <div className="flex justify-end">
          <div className="max-w-[290px] bg-slate-900 text-white p-3 rounded-2xl rounded-tr-xs shadow-md">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {voiceLanguage === 'te' ? 'మీరు అడిగారు' : (voiceLanguage === 'hi' ? 'आपने पूछा' : 'You asked')}
            </span>
            <p className="text-xs font-semibold leading-relaxed">
              "{voiceState.query || answer.question}"
            </p>
          </div>
        </div>

        {/* AI Answer Card */}
        <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-soft space-y-3">
          {/* Top Speaker Status */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center text-white text-xs">
                ✨
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">HealthCopilot AI</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {voiceState.isSpeaking
                    ? (voiceLanguage === 'te' ? 'సమాధానం చెబుతున్నారు...' : (voiceLanguage === 'hi' ? 'बोल रहा है...' : 'Speaking response...'))
                    : (voiceLanguage === 'te' ? 'వాయిస్ సిద్ధం' : (voiceLanguage === 'hi' ? 'तैयार' : 'Speech ready'))}
                </span>
              </div>
            </div>

            {/* Audio Toggle Button */}
            <button
              onClick={() => {
                if (voiceState.isSpeaking) stopSpeaking();
                else askAI(voiceState.query || answer.question, voiceLanguage);
              }}
              className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>{voiceState.isSpeaking ? '⏹️ Stop' : '🔊 Replay'}</span>
            </button>
          </div>

          {/* Animated soundwaves when speaking */}
          {voiceState.isSpeaking && (
            <div className="flex items-center justify-center space-x-1 py-1">
              <div className="w-1 bg-brand-500 rounded-full animate-soundwave-1"></div>
              <div className="w-1 bg-teal-400 rounded-full animate-soundwave-2"></div>
              <div className="w-1 bg-brand-600 rounded-full animate-soundwave-3"></div>
              <div className="w-1 bg-sky-500 rounded-full animate-soundwave-4"></div>
              <div className="w-1 bg-brand-500 rounded-full animate-soundwave-5"></div>
            </div>
          )}

          {/* Spoken Explanation Text */}
          <div className="text-xs text-slate-700 leading-relaxed space-y-2 font-normal">
            <p className="whitespace-pre-line">{answer.answer}</p>
          </div>

          {/* ======================================================== */}
          {/* UPLOAD ACTION CARD (IF USER ASKED TO UPLOAD / SCAN)       */}
          {/* ======================================================== */}
          {answer.action === 'PROMPT_UPLOAD' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 space-y-2">
              <span className="text-[11px] font-bold text-teal-900 block text-left">
                {voiceLanguage === 'te' ? '📸 మీ రిపోర్ట్‌ను స్కాన్ లేదా అప్‌లోడ్ చేయండి' : (voiceLanguage === 'hi' ? '📸 रिपोर्ट स्कैन या अपलोड करें' : '📸 Ready to scan or upload your document')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTriggerUpload}
                  className="py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1"
                >
                  <span>📸</span>
                  <span>{voiceLanguage === 'te' ? 'కెమెరాతో స్కాన్' : (voiceLanguage === 'hi' ? 'कैमरा स्कैन' : 'Scan Camera')}</span>
                </button>
                <button
                  onClick={handleTriggerUpload}
                  className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold shadow-2xs transition flex items-center justify-center gap-1"
                >
                  <span>📁</span>
                  <span>{voiceLanguage === 'te' ? 'ఫైల్ ఎంచుకోండి' : (voiceLanguage === 'hi' ? 'फ़ाइल चुनें' : 'Choose File')}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SIMPLE HUMAN BREAKDOWN SECTION (EVERYDAY UNDERSTANDING) */}
          {/* ======================================================== */}
          {breakdown && (
            <div className="mt-4 pt-3 border-t border-teal-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💡</span>
                  <span className="text-xs font-bold text-slate-900">
                    {voiceLanguage === 'te' ? 'సామాన్యులకు సులభంగా అర్థమయ్యే విశ్లేషణ' : (voiceLanguage === 'hi' ? 'सरल और आसान समझ (सभी के लिए)' : 'Simple Understanding for Everyone')}
                  </span>
                </div>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Patient Friendly
                </span>
              </div>

              {/* Analogy Summary Banner */}
              {breakdown.analogySummary && (
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100 text-[11px] text-sky-900 leading-relaxed font-medium">
                  {breakdown.analogySummary}
                </div>
              )}

              {/* 🟢 Normal Findings */}
              {breakdown.normalFindings && breakdown.normalFindings.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wide flex items-center gap-1">
                    <span>🟢</span>
                    <span>{voiceLanguage === 'te' ? 'పూర్తిగా సాధారణంగా ఉన్నవి (Looking Great):' : (voiceLanguage === 'hi' ? 'पूरी तरह सामान्य (Looking Great):' : 'Healthy Parameters (Looking Great):')}</span>
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {breakdown.normalFindings.map(n => (
                      <div key={n.name} className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[11px]">{n.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-800">{n.value}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{n.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🟡 Watch / Elevate Findings */}
              {breakdown.watchFindings && breakdown.watchFindings.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wide flex items-center gap-1">
                    <span>🟡</span>
                    <span>{voiceLanguage === 'te' ? 'డాక్టర్‌తో చర్చించవలసినవి (Slight Shift):' : (voiceLanguage === 'hi' ? 'डॉक्टर से चर्चा के लिए (Slight Shift):' : 'Points to Discuss with Doctor:')}</span>
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {breakdown.watchFindings.map(w => (
                      <div key={w.name} className="p-2 bg-amber-50/70 rounded-xl border border-amber-200 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 text-[11px]">{w.name}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">{w.value} ({w.status})</span>
                        </div>
                        <p className="text-[10px] text-amber-900 mt-0.5 leading-snug">{w.meaning}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 italic">{w.reassurance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🩺 Questions for the Doctor */}
              {breakdown.doctorQuestions && breakdown.doctorQuestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block text-left">
                    {voiceLanguage === 'te' ? '🩺 మీ తదుపరి అపాయింట్‌మెంట్‌లో డాక్టర్‌ని అడగవలసిన ప్రశ్నలు:' : (voiceLanguage === 'hi' ? '🩺 डॉक्टर से पूछने के लिए महत्वपूर्ण सवाल:' : '🩺 Helpful Questions to Ask Your Doctor:')}
                  </span>
                  <div className="flex flex-col gap-1">
                    {breakdown.doctorQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => askAI(q, voiceLanguage)}
                        className="text-left text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 p-2 rounded-xl border border-slate-200 transition"
                      >
                        ❓ {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medical Grounding Sources */}
          {answer.sources && answer.sources.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Sources:
              </span>
              {answer.sources.map(src => (
                <span key={src} className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  📄 {src}
                </span>
              ))}
            </div>
          )}

          {/* Non-doctor Medical Safety Disclaimer */}
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-normal italic">
            🛡️ {answer.disclaimer || "Notice: This assistant provides educational health summaries and does not offer a medical diagnosis. Consult your physician."}
          </div>
        </div>

        {/* Suggested Context-Aware Follow-up Questions */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {voiceLanguage === 'te' ? 'తదుపరి ప్రశ్నలు' : (voiceLanguage === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Follow-ups')}
          </span>
          <div className="flex flex-col gap-1.5">
            {followUps.map(f => (
              <button
                key={f}
                onClick={() => askAI(f, voiceLanguage)}
                className="text-left text-xs text-slate-700 bg-white hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs transition"
              >
                💬 {f}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Continuous Query Bar */}
      <footer className="px-5 pt-2">
        <form onSubmit={handleAskFollowUp} className="bg-white rounded-2xl shadow-md border border-slate-200 px-3 py-1.5 flex items-center justify-between gap-2">
          <input
            type="text"
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            placeholder={voiceLanguage === 'te' ? 'తదుపరి ప్రశ్నను ఇక్కడ అడగండి...' : (voiceLanguage === 'hi' ? 'आगे का प्रश्न यहाँ पूछें...' : 'Ask a follow-up question...')}
            className="w-full text-xs text-slate-800 bg-transparent placeholder-slate-400 border-none focus:outline-none p-0 pr-1"
          />

          {/* Quick Mic Action to return to speech recognition */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              navigateTo('voice_processing');
            }}
            title="Speak with microphone"
            className="w-7 h-7 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 transition"
          >
            🎙️
          </button>

          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shrink-0 transition"
          >
            <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};
