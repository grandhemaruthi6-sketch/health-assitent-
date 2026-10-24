import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const LoadingStateScreen = () => {
  const { navigateTo } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] pb-12 select-none min-h-[720px]">
      <Header
        title="Loading Report Details..."
        showBack={true}
        onBack={() => navigateTo('recent_reports', 'reports')}
      />

      <main className="flex-1 px-5 pt-4 space-y-4">
        {/* Shimmer Metadata Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3 animate-pulse">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
            <div className="h-3 w-16 bg-slate-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-slate-200 rounded-full"></div>
              <div className="h-3.5 w-28 bg-slate-300 rounded-full"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 bg-slate-200 rounded-full"></div>
              <div className="h-3.5 w-24 bg-slate-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Shimmer AI Summary Banner */}
        <div className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100/60 space-y-2.5 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-teal-200"></div>
            <div className="h-3.5 w-32 bg-teal-200 rounded-full"></div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full bg-teal-100 rounded-full"></div>
            <div className="h-2.5 w-5/6 bg-teal-100 rounded-full"></div>
            <div className="h-2.5 w-3/4 bg-teal-100 rounded-full"></div>
          </div>
        </div>

        {/* Shimmer Biomarker Cards (x3) */}
        <div className="space-y-3">
          <div className="h-3.5 w-36 bg-slate-200 rounded-full mb-1"></div>

          {[1, 2, 3].map(item => (
            <div key={item} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-300 rounded-full"></div>
                  <div className="h-2.5 w-40 bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-5 w-16 bg-emerald-100 rounded-full"></div>
              </div>

              {/* Slider skeleton */}
              <div className="h-2 w-full bg-slate-100 rounded-full"></div>

              {/* Text skeleton */}
              <div className="h-8 bg-slate-50 rounded-xl p-2"></div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => navigateTo('report_details')}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            Finished loading? View Full Report ›
          </button>
        </div>
      </main>
    </div>
  );
};
