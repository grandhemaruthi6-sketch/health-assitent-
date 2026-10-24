import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const DesignSystemComparisonScreen = () => {
  const { navigateTo } = useApp();

  const brandColors = [
    { name: 'brand-50', hex: '#F0FDFB' },
    { name: 'brand-100', hex: '#CCFBF1' },
    { name: 'brand-200', hex: '#99F6E4' },
    { name: 'brand-300', hex: '#5EEAD4' },
    { name: 'brand-500', hex: '#00A896', isPrimary: true },
    { name: 'brand-700', hex: '#0F766E' },
    { name: 'brand-900', hex: '#134E4A' },
    { name: 'hc-secondary', hex: '#0284C7' },
    { name: 'hc-accent', hex: '#38BDF8' },
    { name: 'hc-success', hex: '#10B981' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] pb-12 select-none min-h-[720px]">
      <Header
        title="Design System & Report Comparison"
        showBack={true}
        onBack={() => navigateTo('home', 'home')}
      />

      <main className="flex-1 px-5 pt-4 space-y-6">
        {/* SECTION 1: COMPARE REPORTS LIVE VIEW */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Spec Screen 24</span>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              Compare 3 Reports
            </span>
          </div>

          {/* AI Insight Summary Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-sky-50 p-3.5 rounded-2xl border border-teal-100/70 shadow-2xs space-y-1">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white shrink-0 mt-0.5 text-xs">
                ✨
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Here's what I found...</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Hemoglobin stabilized at healthy levels over the last 6 months (Dec 2024 – Apr 2025).
                </p>
              </div>
            </div>
          </div>

          {/* Date Interval Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selected Intervals
            </label>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Dec 2024
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5"></span>Feb 2025
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-1.5"></span>Apr 2025
              </span>
            </div>
          </div>

          {/* Metric 1: Hemoglobin Bar/Trend Chart Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Hemoglobin (g/dL)</h3>
                <p className="text-[10px] text-slate-400">Normal Range: 12.0 - 16.0 g/dL</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Normal
              </span>
            </div>

            {/* Bar Graph Visualization */}
            <div className="pt-3 pb-2 px-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <div className="flex items-end justify-around h-28 w-full pt-2">
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-700">12.8</span>
                  <div className="w-8 bg-brand-500 rounded-t-md" style={{ height: '58px' }}></div>
                  <span className="text-[10px] text-slate-500 font-medium pt-1">Dec '24</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-700">13.1</span>
                  <div className="w-8 bg-hc-secondary rounded-t-md" style={{ height: '66px' }}></div>
                  <span className="text-[10px] text-slate-500 font-medium pt-1">Feb '25</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-700">13.2</span>
                  <div className="w-8 bg-teal-500 rounded-t-md" style={{ height: '70px' }}></div>
                  <span className="text-[10px] text-slate-500 font-medium pt-1">Apr '25</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-medium">
              <span>✓ All values are within normal clinical thresholds.</span>
            </div>
          </div>

          {/* Metric 2: WBC Count Comparison */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-slate-900">WBC Count</h3>
                <span className="text-[10px] text-slate-400">Reference: 4.0 - 10.5 K/μL</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                Slightly Elevated
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Dec 2024</div>
                <div className="text-xs font-bold text-slate-800">9.8</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-[10px] text-slate-400">Feb 2025</div>
                <div className="text-xs font-bold text-slate-800">10.9</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] text-amber-700 font-semibold">Apr 2025</div>
                <div className="text-xs font-bold text-amber-800">11.2</div>
              </div>
            </div>
          </div>

          {/* Retry State Component Example */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 text-xs font-bold">
                !
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Upload Incomplete</div>
                <div className="text-[10px] text-slate-500">Failed to parse Lipid Panel.</div>
              </div>
            </div>
            <button
              onClick={() => navigateTo('retry_upload')}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition"
            >
              Retry
            </button>
          </div>
        </section>

        {/* SECTION 2: DESIGN SYSTEM CATALOG */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Design System Palette
            </h3>
          </div>

          {/* Color Tokens Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {brandColors.map(c => (
              <div key={c.name} className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1.5">
                <div className="h-9 rounded-lg shadow-inner" style={{ backgroundColor: c.hex }}></div>
                <div className="text-[10px]">
                  <span className="font-bold text-slate-800 block truncate">{c.name}</span>
                  <span className="text-slate-400 font-mono">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Typography Hierarchy */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Typography System
            </span>
            <div className="space-y-1.5 border-t border-slate-100 pt-2">
              <div>
                <span className="text-lg font-bold text-slate-900">Display Heading (24px Bold)</span>
                <span className="text-[10px] text-slate-400 block">Plus Jakarta Sans / SF Pro Display</span>
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800">Section Header (14px Bold)</span>
              </div>
              <div>
                <span className="text-xs text-slate-600">Body Copy (12px Regular) — Clean medical readability</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Micro Captions &amp; Metadata (10px)</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
