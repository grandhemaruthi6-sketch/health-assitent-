import React from 'react';
import { useApp } from '../context/AppContext';

export const MicrophonePermissionModal = ({ standalone = false }) => {
  const { permissionModal, setPermissionModal, navigateTo } = useApp();

  const handleClose = () => {
    setPermissionModal(false);
    if (standalone) {
      navigateTo('home', 'home');
    }
  };

  const handleTryAgain = () => {
    setPermissionModal(false);
    navigateTo('voice_processing');
  };

  if (!permissionModal && !standalone) return null;

  return (
    <div className={`${standalone ? 'flex-1 flex flex-col justify-center items-center p-6 bg-slate-900/60' : 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in'}`}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Amber Mic Off Badge */}
        <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
          <svg className="w-8 h-8 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            Microphone Access Required
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            HealthCopilot needs microphone permission to listen to your health questions. Audio is processed locally and never stored.
          </p>
        </div>

        {/* Browser Settings Guide */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left space-y-1.5 text-[11px] text-slate-600">
          <span className="font-bold text-slate-800 block">How to enable:</span>
          <p>1. Tap the lock/tune icon in your browser address bar.</p>
          <p>2. Set <b>Microphone</b> to <b>Allow</b>.</p>
          <p>3. Tap Try Again below.</p>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleTryAgain}
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-soft transition"
          >
            Allow &amp; Try Again
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Use Text Input Instead
          </button>
        </div>
      </div>
    </div>
  );
};
