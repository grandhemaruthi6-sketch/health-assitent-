import React from 'react';
import { useApp } from '../context/AppContext';

export const OnboardingScreen2 = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="flex-1 flex flex-col justify-between bg-white px-7 pt-4 pb-8 min-h-[720px] select-none">
      {/* Top Brand Header */}
      <div className="flex items-center justify-center space-x-2 pt-2 pb-1" data-purpose="app-branding">
        <div className="w-5 h-5 rounded-full bg-[#009488] flex items-center justify-center shadow-xs">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-800">HealthCopilot AI</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Title & Description */}
        <div className="px-2 mb-6">
          <h1 className="text-[26px] leading-tight font-bold text-slate-900 tracking-tight">
            Ask Questions<br />Anytime
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-500 font-normal max-w-[280px] mx-auto">
            Have questions about your results? Tap the mic or type to chat with your Health AI assistant.
          </p>
        </div>

        {/* Center Graphic Illustration */}
        <div className="relative w-[280px] h-[240px] flex items-center justify-center my-2">
          {/* Ambient Glows */}
          <div className="absolute w-52 h-52 bg-emerald-100/60 rounded-full blur-2xl -top-4 -right-2 pointer-events-none"></div>
          <div className="absolute w-44 h-44 bg-cyan-100/60 rounded-full blur-xl -bottom-2 -left-2 pointer-events-none"></div>

          {/* Chat Bubble 1: User Query */}
          <div className="absolute top-4 right-4 max-w-[190px] bg-slate-900 text-white rounded-2xl rounded-tr-xs p-3 text-left shadow-lg">
            <p className="text-[11px] leading-snug">"Is my hemoglobin count normal?"</p>
          </div>

          {/* Chat Bubble 2: AI Voice Response */}
          <div className="absolute bottom-8 left-3 max-w-[210px] bg-white rounded-2xl rounded-tl-xs p-3.5 border border-teal-100 shadow-xl text-left space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs">
                ✨
              </div>
              <span className="text-[11px] font-bold text-teal-800">Health AI Voice</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              "Yes! At 13.2 g/dL, it sits right in the optimal healthy range for you."
            </p>
            {/* Audio Wave representation */}
            <div className="flex items-center space-x-1 pt-1">
              <div className="w-1 bg-teal-500 rounded-full animate-soundwave-1"></div>
              <div className="w-1 bg-teal-500 rounded-full animate-soundwave-2"></div>
              <div className="w-1 bg-teal-500 rounded-full animate-soundwave-3"></div>
              <div className="w-1 bg-teal-500 rounded-full animate-soundwave-4"></div>
              <div className="w-1 bg-teal-500 rounded-full animate-soundwave-5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="w-full space-y-5">
        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-7 h-2 bg-brand-500 rounded-full"></div>
          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentScreen('login')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-4 py-3 transition"
          >
            Skip
          </button>
          <button
            onClick={() => setCurrentScreen('onboarding_3')}
            className="flex-1 py-3.5 px-6 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
          >
            <span>Next</span>
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
