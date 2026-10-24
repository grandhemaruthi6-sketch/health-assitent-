import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { TREND_METRICS } from '../data/mockData';

export const TrendChartScreen = () => {
  const { navigateTo, askAI } = useApp();
  const [selectedMetricKey, setSelectedMetricKey] = useState('hemoglobin');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6M');

  const currentMetric = TREND_METRICS[selectedMetricKey];

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] pb-10 select-none min-h-[720px]">
      <Header
        title="Biomarker Trends"
        showBack={true}
        onBack={() => navigateTo('timeline', 'timeline')}
      />

      <main className="flex-1 px-5 pt-4 space-y-4">
        {/* Metric Switcher Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {Object.entries(TREND_METRICS).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedMetricKey(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedMetricKey === key
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {data.name}
            </button>
          ))}
        </div>

        {/* AI Insight Summary Banner */}
        <div className="bg-gradient-to-r from-teal-50 to-sky-50 p-3.5 rounded-2xl border border-teal-100/70 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white shrink-0 text-xs">
              ✨
            </div>
            <h4 className="text-xs font-bold text-slate-800">Longitudinal AI Summary</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {currentMetric.aiInsight}
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Selected Interval
          </label>
          <div className="flex items-center space-x-1 bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-bold">
            {['3M', '6M', '1Y', 'All'].map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-0.5 rounded-md transition ${
                  selectedTimeframe === tf ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Trend Chart Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">{currentMetric.name} ({currentMetric.unit})</h3>
              <p className="text-[10px] text-slate-400">
                Target Normal: {currentMetric.normalMin} - {currentMetric.normalMax} {currentMetric.unit}
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Optimal Trend
            </span>
          </div>

          {/* Bar / Column Chart Visualization */}
          <div className="pt-4 pb-2 px-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-end justify-around h-36 w-full pt-4">
              {currentMetric.history.map((pt, idx) => {
                // calculate bar height percentage
                const heightPx = Math.min(100, Math.max(30, (pt.value / currentMetric.normalMax) * 75));
                const colors = ['bg-hc-primary', 'bg-hc-secondary', 'bg-teal-500'];
                return (
                  <div key={pt.date} className="flex flex-col items-center space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800">{pt.value}</span>
                    <div
                      className={`w-10 rounded-t-lg transition-all duration-300 hover:brightness-105 shadow-xs ${colors[idx % colors.length]}`}
                      style={{ height: `${heightPx}px` }}
                    ></div>
                    <span className="text-[10px] text-slate-500 font-medium pt-1">{pt.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical normalcy indicator */}
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-medium pt-1">
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
              <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
            </svg>
            <span>All historical measurements are within clinical bounds.</span>
          </div>
        </div>

        {/* Detailed 3-Date Comparison Matrix */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-800">History Progression</h4>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            {currentMetric.history.map((pt, idx) => (
              <div
                key={pt.date}
                className={`p-2.5 rounded-xl border ${
                  idx === currentMetric.history.length - 1
                    ? 'bg-teal-50/70 border-teal-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="text-[10px] text-slate-400">{pt.date}</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{pt.value} {currentMetric.unit}</div>
                <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">{pt.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ask Voice AI action */}
        <button
          onClick={() => askAI(`How has my ${currentMetric.name} changed over the last 6 months?`)}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
        >
          <span>🎙️</span>
          <span>Ask AI: "How has my {currentMetric.name} changed?"</span>
        </button>
      </main>
    </div>
  );
};
