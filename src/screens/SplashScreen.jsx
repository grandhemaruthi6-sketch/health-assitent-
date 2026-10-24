import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const SplashScreen = () => {
  const { setCurrentScreen, handleTabChange, isAuthenticated, isAuthLoading } = useApp();

  const handleNextScreen = () => {
    setCurrentScreen('onboarding_1');
  };

  useEffect(() => {
    // Smooth auto-transition after 4 seconds to Onboarding 1
    const timer = setTimeout(() => {
      handleNextScreen();
    }, 4000);

    return () => clearTimeout(timer);
  }, [setCurrentScreen]);

  return (
    <div
      onClick={handleNextScreen}
      className="relative flex-1 flex flex-col justify-between items-center p-6 min-h-[680px] select-none cursor-pointer overflow-hidden bg-gradient-to-b from-[#f4fbfb] via-[#e6f6f6] to-[#ddf2f2]"
      data-purpose="splash-branding-content"
    >
      {/* Subtle ambient blur circles */}
      <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-200/30 blur-3xl pointer-events-none"></div>

      {/* Top spacing / Skip */}
      <div className="pt-4 w-full flex items-center justify-between z-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-700 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full border border-teal-200/50 shadow-xs">
          AI Healthcare Companion
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTabChange('home');
          }}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white/60 hover:bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/60 transition"
        >
          Skip to Home ›
        </button>
      </div>

      {/* Center Branding Emblem */}
      <div className="flex flex-col items-center justify-center -mt-6 text-center z-10">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#009488] to-[#00A896] rounded-full flex items-center justify-center shadow-xl shadow-teal-500/25 ring-8 ring-white/70 animate-pulse">
            {/* Heartbeat EKG Lifeline SVG */}
            <svg
              className="w-12 h-12 text-white stroke-[2.75]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 40 40"
            >
              <path d="M4 20.5H12.5L16 11.5L22.5 28.5L27 16L29.5 20.5H36" />
            </svg>
          </div>
        </div>

        <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-2">
          HealthCopilot AI
        </h1>
        <p className="text-sm text-slate-500 font-medium tracking-normal">
          Understand Your Health,
        </p>
        <p className="text-sm text-slate-500 font-medium tracking-normal -mt-0.5">
          With Confidence.
        </p>

        {/* Circular Loading Spinner */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
          <span className="text-[11px] text-slate-400 font-medium">Entering interactive tour...</span>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="w-full pb-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextScreen();
          }}
          className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-sm rounded-2xl shadow-soft transition tracking-wide flex items-center justify-center gap-2"
        >
          <span>Start Onboarding Tour</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};
