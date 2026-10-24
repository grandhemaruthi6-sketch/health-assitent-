import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBar } from './StatusBar';
import { SCREEN_INVENTORY } from './ScreenGalleryModal';

export const DeviceFrameWrapper = ({ children }) => {
  const {
    viewMode,
    setViewMode,
    currentScreen,
    setShowScreenGallery,
    restoreSampleReports,
    setCurrentScreen
  } = useApp();

  const [isFrameless, setIsFrameless] = useState(false);

  // Dev preview shell is hidden by default and only shown when ?dev=1 is in URL
  const isDevMode = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('dev') === '1');

  const currentScreenMeta = SCREEN_INVENTORY.find(s => s.id === currentScreen) || {
    label: currentScreen,
    category: 'Application'
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DEFAULT: Premium iPhone 17 Pro Max Presentation
  // Mobile: full-screen (no visible frame border)
  // sm+ (tablet/desktop): centered phone with titanium chassis + ambient lighting
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDevMode) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#080c14] via-[#070b12] to-[#040608] flex flex-col items-center justify-center font-sans select-none antialiased relative overflow-hidden">

        {/* Studio ambient lighting */}
        <div className="absolute w-[700px] h-[700px] rounded-full bg-teal-500/8 blur-[140px] pointer-events-none -top-32 left-1/2 -translate-x-1/2" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-500/6 blur-[120px] pointer-events-none bottom-0 left-1/2 -translate-x-1/2" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-violet-500/4 blur-[80px] pointer-events-none top-1/2 -translate-y-1/2 -left-16" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/4 blur-[80px] pointer-events-none top-1/2 -translate-y-1/2 -right-16" />

        {/* iPhone 17 Pro Max hardware frame */}
        <div className="relative w-full sm:w-[393px] h-screen sm:h-[852px] flex flex-col sm:mx-auto">

          {/* Side buttons (sm+ only) */}
          {/* Action button */}
          <div className="hidden sm:block absolute -left-[12px] top-[148px] w-[4px] h-[30px] bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 rounded-l-md shadow-lg" />
          {/* Volume Up */}
          <div className="hidden sm:block absolute -left-[12px] top-[196px] w-[4px] h-[58px] bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 rounded-l-md shadow-lg" />
          {/* Volume Down */}
          <div className="hidden sm:block absolute -left-[12px] top-[270px] w-[4px] h-[58px] bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 rounded-l-md shadow-lg" />
          {/* Power button */}
          <div className="hidden sm:block absolute -right-[12px] top-[218px] w-[4px] h-[86px] bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 rounded-r-md shadow-lg" />
          {/* Camera Control */}
          <div className="hidden sm:block absolute -right-[11px] top-[578px] w-[3px] h-[66px] bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 rounded-r-md shadow-md border border-slate-500/30" />

          {/* Titanium chassis */}
          <div className="w-full h-full sm:rounded-[52px] sm:p-[9px] sm:bg-gradient-to-b sm:from-[#636669] sm:via-[#4c4f53] sm:to-[#3c3f42] sm:shadow-[0_28px_75px_rgba(0,0,0,0.95),0_10px_36px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.45)] sm:ring-1 sm:ring-white/8 flex flex-col overflow-hidden relative">

            {/* Titanium specular sheen */}
            <div className="hidden sm:block absolute inset-0 rounded-[52px] bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />

            {/* OLED screen glass */}
            <div className="w-full h-full sm:rounded-[44px] bg-white flex flex-col relative overflow-hidden sm:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">

              {/* Dynamic Island + Status Bar */}
              <StatusBar />

              {/* Screen content */}
              <div className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar">
                {children}
              </div>

              {/* iOS Home Indicator */}
              <div className="w-full pb-2 pt-1 bg-white flex justify-center items-center select-none shrink-0">
                <div className="w-32 h-[5px] bg-slate-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Soft reflection below phone (sm+ only) */}
        <div className="hidden sm:block w-[320px] h-[20px] mt-[-2px] bg-teal-400/8 blur-xl rounded-full" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEV MODE (?dev=1): Multi-viewport preview shell
  // ─────────────────────────────────────────────────────────────────────────────
  let containerClasses = "w-full max-w-[393px] h-[852px] max-h-[calc(100vh-100px)] rounded-[48px] border-[8px] border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden bg-white flex flex-col";
  if (viewMode === 'tablet') {
    containerClasses = "w-full max-w-[768px] h-[1024px] max-h-[calc(100vh-100px)] rounded-[36px] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden bg-white flex flex-col";
  } else if (viewMode === 'desktop') {
    containerClasses = "w-full max-w-5xl h-[820px] max-h-[calc(100vh-100px)] rounded-2xl border border-slate-200 shadow-2xl relative overflow-hidden bg-white flex flex-col";
  }

  if (isFrameless) {
    containerClasses = "w-full max-w-md min-h-screen relative bg-white flex flex-col shadow-xl";
  }

  return (
    <div className={`min-h-screen ${isFrameless ? 'bg-slate-100' : 'bg-slate-950'} text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 select-none font-sans`}>

      {/* Dev Toolbar */}
      <header className="w-full max-w-5xl mb-3 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xl z-30">

        {/* Brand & Screen Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-400 flex items-center justify-center text-white shadow-md shrink-0">
            <svg className="w-4 h-4 fill-none stroke-white stroke-[2.5]" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white tracking-tight">HealthCopilot AI</span>
              <span className="hidden sm:inline text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">Dev</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
              Screen: <span className="text-teal-400 font-medium">{currentScreenMeta.label}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Viewport Switcher: Mobile / iPad / Web */}
          <div className="bg-slate-800 p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => { setViewMode('mobile'); setIsFrameless(false); }}
              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                viewMode === 'mobile' && !isFrameless ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile (393px)"
            >
              <span>📱</span><span className="hidden md:inline">Mobile</span>
            </button>
            <button
              onClick={() => { setViewMode('tablet'); setIsFrameless(false); }}
              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                viewMode === 'tablet' && !isFrameless ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="iPad (768px)"
            >
              <span>🖥</span><span className="hidden md:inline">iPad</span>
            </button>
            <button
              onClick={() => { setViewMode('desktop'); setIsFrameless(false); }}
              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                viewMode === 'desktop' && !isFrameless ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Web (full width)"
            >
              <span>💻</span><span className="hidden md:inline">Web</span>
            </button>
          </div>

          {/* Screen Gallery */}
          <button
            onClick={() => setShowScreenGallery(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🧭</span>
            <span>All Screens</span>
          </button>

          {/* Reset Data */}
          <button
            onClick={restoreSampleReports}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/60 transition"
            title="Reset Demo Data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Device Container */}
      <main className="w-full flex justify-center items-start py-1">
        <div className={containerClasses}>
          <StatusBar />
          <div className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50/50">
            {children}
          </div>
          {!isFrameless && viewMode === 'mobile' && (
            <div className="w-full py-1.5 bg-white flex justify-center items-center select-none sticky bottom-0 z-50">
              <div className="w-28 h-[5px] bg-slate-200 rounded-full" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
