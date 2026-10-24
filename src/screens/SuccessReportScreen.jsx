import React from 'react';
import { useApp } from '../context/AppContext';

export const SuccessReportScreen = () => {
  const { setCurrentScreen, handleTabChange, extractedDraft } = useApp();

  return (
    <div className="flex-1 flex flex-col justify-between bg-white px-7 pt-7 pb-8 select-none min-h-[720px] text-center">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Success Animated Emblem */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/15">
            <svg className="w-10 h-10 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Confetti dot */}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-teal-400 rounded-full border-2 border-white animate-ping"></span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Report Analyzed Successfully!
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
          We extracted <span className="font-bold text-slate-800">{extractedDraft?.biomarkers?.length || 5} clinical markers</span> from your document.
        </p>

        {/* Metadata Snapshot Card */}
        <div className="w-full mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-400 block">Detected Facility</span>
              <span className="text-xs font-bold text-slate-800">
                {extractedDraft?.hospitalDetected ? extractedDraft.hospitalName : "Hospital not identified in document"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              {extractedDraft?.category || "Lab Report"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {extractedDraft?.biomarkers?.slice(0, 2).map(bm => (
              <div key={bm.id} className="p-2.5 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">{bm.name}</span>
                <span className="font-bold text-slate-800">{bm.value} {bm.unit}</span>
                <span className="text-[9px] text-emerald-600 block">{bm.status}</span>
              </div>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Report Date: {extractedDraft?.date || "Not detected"}</span>
            <span className={extractedDraft?.reportDate && !extractedDraft?.isDateUncertain ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>{extractedDraft?.reportDate && !extractedDraft?.isDateUncertain ? "✓ Extracted from document" : "Date needs confirmation"}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2.5 pt-4">
        <button
          onClick={() => setCurrentScreen('extracted_review')}
          className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
        >
          <span>Review Extracted Results</span>
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          onClick={() => handleTabChange('home')}
          className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          Back to Home Dashboard
        </button>
      </div>
    </div>
  );
};
