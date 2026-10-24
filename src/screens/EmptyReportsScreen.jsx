import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';

export const EmptyReportsScreen = () => {
  const { navigateTo, restoreSampleReports } = useApp();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      <Header title="Medical Reports" />

      <main className="flex-1 overflow-y-auto px-6 pt-10 pb-20 flex flex-col items-center justify-center text-center">
        {/* Soft Illustration Badge */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center text-brand-500 shadow-xl shadow-teal-500/10">
            <svg className="w-12 h-12 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Magnifier / plus badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
            +
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          No Medical Reports Found
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
          Upload your blood tests, metabolic panels, or clinical prescriptions to start tracking your biomarkers and health trends.
        </p>

        {/* Buttons */}
        <div className="w-full max-w-xs space-y-3 mt-8">
          <button
            onClick={() => navigateTo('upload')}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4 stroke-white stroke-[2.2]" fill="none" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Upload Your First Report</span>
          </button>

          <button
            onClick={restoreSampleReports}
            className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-bold transition"
          >
            Load 3 Sample Reports (CBC, Lipid, Thyroid)
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
