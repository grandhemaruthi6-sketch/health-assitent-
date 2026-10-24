import React from 'react';
import { useApp } from '../context/AppContext';

export const OnboardingScreen3 = () => {
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
        <div className="px-2 mb-4">
          <h1 className="text-[26px] leading-tight font-bold text-slate-900 tracking-tight">
            Track Health<br />Over Time
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-500 font-normal max-w-[280px] mx-auto">
            Compare lab reports across months and years. See trends before they become health concerns.
          </p>
        </div>

        {/* Center Graphic Illustration */}
        <div className="relative w-[280px] h-[240px] flex items-center justify-center my-2">
          {/* Ambient Glows */}
          <div className="absolute w-52 h-52 bg-teal-100/60 rounded-full blur-2xl -top-2 -left-2 pointer-events-none"></div>
          <div className="absolute w-44 h-44 bg-sky-100/60 rounded-full blur-xl -bottom-2 -right-2 pointer-events-none"></div>

          {/* Trend Chart Card */}
          <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-4 space-y-3 z-10">
            <div className="flex items-center justify-between text-left">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Hemoglobin (g/dL)</span>
                <span className="text-[10px] text-slate-400">Normal Range: 12.0 - 16.0</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Healthy Trend
              </span>
            </div>

            {/* Simulated 3-point bar chart */}
            <div className="pt-2 px-2 bg-slate-50/70 rounded-xl border border-slate-100/80">
              <div className="flex items-end justify-around h-24 w-full pt-2">
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-700">12.8</span>
                  <div className="w-7 bg-teal-400 rounded-t-md h-12"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Dec</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-700">13.1</span>
                  <div className="w-7 bg-teal-500 rounded-t-md h-14"></div>
                  <span className="text-[9px] text-slate-400 font-medium">Feb</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-700">13.2</span>
                  <div className="w-7 bg-brand-500 rounded-t-md h-16 shadow-sm"></div>
                  <span className="text-[9px] text-teal-700 font-bold">Apr</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-medium pt-1 text-left">
              <span>✓ Steady improvement over 6 months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="w-full space-y-5">
        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-7 h-2 bg-brand-500 rounded-full"></div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setCurrentScreen('login')}
          className="w-full py-3.5 px-6 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
        >
          <span>Get Started Now</span>
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};
