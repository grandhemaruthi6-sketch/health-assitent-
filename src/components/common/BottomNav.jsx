import React from 'react';
import { useApp } from '../../context/AppContext';

export const BottomNav = () => {
  const { activeTab, handleTabChange, navigateTo } = useApp();

  return (
    <nav
      className="sticky bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-between z-40 safe-bottom shadow-lg mt-auto"
      data-purpose="bottom-tab-bar"
    >
      {/* Tab 1: Home */}
      <button
        onClick={() => handleTabChange('home')}
        className={`flex flex-col items-center space-y-1 flex-1 transition py-1 ${
          activeTab === 'home' ? 'text-brand-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
        type="button"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        <span className="text-[10px]">Home</span>
      </button>

      {/* Tab 2: Reports */}
      <button
        onClick={() => handleTabChange('reports')}
        className={`flex flex-col items-center space-y-1 flex-1 transition py-1 ${
          activeTab === 'reports' ? 'text-brand-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
        type="button"
      >
        <svg className="w-5 h-5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px]">Reports</span>
      </button>

      {/* Floating Center Action Button: AI Voice Assistant */}
      <div className="flex-1 flex justify-center -mt-6">
        <button
          onClick={() => navigateTo('voice_answer')}
          aria-label="Open AI Voice Assistant"
          className="w-12 h-12 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white flex items-center justify-center shadow-floating border-4 border-white transition transform duration-200"
          type="button"
        >
          <svg className="w-6 h-6 stroke-white stroke-[2.5]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Tab 3: Timeline */}
      <button
        onClick={() => handleTabChange('timeline')}
        className={`flex flex-col items-center space-y-1 flex-1 transition py-1 ${
          activeTab === 'timeline' ? 'text-brand-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
        type="button"
      >
        <svg className="w-5 h-5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[10px]">Timeline</span>
      </button>

      {/* Tab 4: Profile */}
      <button
        onClick={() => handleTabChange('profile')}
        className={`flex flex-col items-center space-y-1 flex-1 transition py-1 ${
          activeTab === 'profile' ? 'text-brand-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
        type="button"
      >
        <svg className="w-5 h-5 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
