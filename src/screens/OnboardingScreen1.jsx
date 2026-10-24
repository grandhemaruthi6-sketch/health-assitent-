import React from 'react';
import { useApp } from '../context/AppContext';

export const OnboardingScreen1 = () => {
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
            Your Lab Reports,<br />In Simple Words
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-500 font-normal max-w-[280px] mx-auto">
            Upload your medical reports and get clear, easy-to-understand insights powered by AI.
          </p>
        </div>

        {/* Center Graphic Illustration */}
        <div className="relative w-[280px] h-[240px] flex items-center justify-center my-2">
          {/* Soft Background Glows */}
          <div className="absolute w-52 h-52 bg-sky-100/70 rounded-full blur-2xl -top-4 -left-2 pointer-events-none"></div>
          <div className="absolute w-44 h-44 bg-teal-100/60 rounded-full blur-xl -bottom-2 -right-2 pointer-events-none"></div>

          {/* Left Document Card */}
          <div className="absolute left-3 top-6 w-[124px] h-[162px] bg-white rounded-2xl shadow-lg border border-slate-100 p-3 flex flex-col justify-between transform -rotate-3 transition duration-300">
            <div className="flex items-center space-x-1.5 pb-1 border-b border-slate-100">
              <div className="w-5 h-5 rounded bg-teal-50 flex items-center justify-center">
                <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
            </div>
            <div className="space-y-2 my-auto">
              <div className="flex items-center justify-between">
                <div className="h-1.5 w-10 bg-slate-200 rounded-full"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[8px] font-bold">✓</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-1.5 w-12 bg-slate-200 rounded-full"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[8px] font-bold">✓</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-1.5 w-8 bg-slate-200 rounded-full"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[8px] font-bold">✓</div>
              </div>
            </div>
            <div className="h-1.5 w-14 bg-teal-100 rounded-full"></div>
          </div>

          {/* Right Floating Analysis Card */}
          <div className="absolute right-3 top-10 w-[140px] bg-white rounded-2xl shadow-xl border border-teal-100/80 p-3.5 space-y-2 transform rotate-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">AI Summary</span>
                <span className="text-[9px] text-emerald-600 font-semibold">All Normal</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Hemoglobin is healthy at 13.2 g/dL.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="w-full space-y-5">
        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-7 h-2 bg-brand-500 rounded-full"></div>
          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
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
            onClick={() => setCurrentScreen('onboarding_2')}
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
