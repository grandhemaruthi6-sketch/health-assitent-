/**
 * HealthCopilot Conversational Voice Assistant Engine
 * 
 * Provides natural multilingual Speech-to-Text (STT) and Text-to-Speech (TTS)
 * for Telugu (te-IN), Indian English (en-IN), and Hindi (hi-IN).
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'te', locale: 'te-IN', label: 'తెలుగు', name: 'Telugu', greeting: 'నమస్కారం! నేను HealthCopilot అసిస్టెంట్ని. మీకు ఎలా సహాయపడగలను?' },
  { code: 'en', locale: 'en-IN', label: 'English', name: 'Indian English', greeting: "Hello! I'm your HealthCopilot assistant. How can I help you today?" },
  { code: 'hi', locale: 'hi-IN', label: 'हिन्दी', name: 'Hindi', greeting: 'नमस्ते! मैं आपका HealthCopilot असिस्टेंट हूँ। मैं आपकी कैसे मदद कर सकता हूँ?' }
];

export const GREETINGS = {
  te: 'నమస్కారం! నేను HealthCopilot అసిస్టెంట్ని. మీకు ఎలా సహాయపడగలను?',
  en: "Hello! I'm your HealthCopilot assistant. How can I help you today?",
  hi: 'नमस्ते! मैं आपका HealthCopilot असिस्टेंट हूँ। मैं आपकी कैसे मदद कर सकता हूँ?'
};

// State flag to ensure the greeting only plays once per voice session
let hasGreetedInCurrentSession = false;

export function resetVoiceSessionGreeting() {
  hasGreetedInCurrentSession = false;
}

export function hasGreeted() {
  return hasGreetedInCurrentSession;
}

export function markGreeted() {
  hasGreetedInCurrentSession = true;
}

/**
 * Finds the highest quality natural voice for the target language in the browser
 */
export function getBestVoiceForLanguage(langCode = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetLang = langCode.toLowerCase();
  const localePrefix = targetLang === 'te' ? 'te' : (targetLang === 'hi' ? 'hi' : 'en');
  const fullLocale = targetLang === 'te' ? 'te-in' : (targetLang === 'hi' ? 'hi-in' : 'en-in');

  // 1. High priority: natural / neural voices matching specific Indian locale
  const naturalKeywords = ['natural', 'online', 'neural', 'google', 'microsoft'];

  const matchedVoices = voices.filter(v => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    return vLang === fullLocale || vLang.startsWith(localePrefix);
  });

  if (matchedVoices.length === 0) {
    // Fallback: match by voice name containing language keyword
    const nameMatched = voices.find(v => {
      const vName = (v.name || '').toLowerCase();
      if (targetLang === 'te') return vName.includes('telugu');
      if (targetLang === 'hi') return vName.includes('hindi');
      return vName.includes('india') || vName.includes('indian');
    });
    if (nameMatched) return nameMatched;
  }

  // Prioritize natural/online voices within matched
  const bestNatural = matchedVoices.find(v => {
    const vName = (v.name || '').toLowerCase();
    return naturalKeywords.some(k => vName.includes(k));
  });

  return bestNatural || matchedVoices[0] || null;
}

/**
 * Natural human-sounding speech synthesis with rate calibration and interruption support
 */
export function speakNaturalUtterance(text, {
  language = 'en',
  rate = 0.95,
  pitch = 1.0,
  onStart = () => {},
  onEnd = () => {},
  onError = () => {}
} = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError(new Error('SpeechSynthesis is not supported in this browser environment.'));
    return;
  }

  try {
    // Cancel any prior utterance immediately to support rapid interruptions
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) {
      onEnd();
      return;
    }

    // Clean text of markdown asterisks and URLs for spoken natural flow
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/⚠️/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = getBestVoiceForLanguage(language);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = language === 'te' ? 'te-IN' : (language === 'hi' ? 'hi-IN' : 'en-IN');
    }

    // Human conversational prosody
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => onStart();
    utterance.onend = () => onEnd();
    utterance.onerror = (e) => {
      // Don't report error if canceled by interruption
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        onError(e);
      } else {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[VoiceEngine] SpeechSynthesis error:', err);
    onError(err);
  }
}

/**
 * Cancel any ongoing speech output
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Plays the natural welcome greeting for the given language only once per session
 */
export function playNaturalGreeting(language = 'en', { onStart, onEnd } = {}) {
  if (hasGreetedInCurrentSession) {
    if (onEnd) onEnd();
    return;
  }

  const greeting = GREETINGS[language] || GREETINGS.en;
  hasGreetedInCurrentSession = true;

  speakNaturalUtterance(greeting, {
    language,
    rate: 0.95,
    onStart,
    onEnd
  });
}
