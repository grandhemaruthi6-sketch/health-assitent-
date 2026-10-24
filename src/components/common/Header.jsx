import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Header = ({ title, subtitle, showBack = false, onBack, rightAction }) => {
  const { navigateTo, handleTabChange, userProfile } = useApp();
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  return (
    <header className="px-5 py-2.5 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-30" data-purpose="main-header">
      {/* Left side: Back button or App Brand Logo */}
      {showBack ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack || (() => navigateTo('home', 'home'))}
            aria-label="Go Back"
            className="p-1 -ml-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition active:scale-95"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight truncate max-w-[200px] block leading-tight">
              {title || "Back"}
            </span>
            {subtitle && (
              <span className="text-[10px] text-slate-400 font-medium block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => navigateTo('home', 'home')}
          className="flex items-center space-x-2 text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-brand-500 group-hover:bg-brand-600 flex items-center justify-center text-white shadow-sm transition shrink-0">
            <svg className="w-4 h-4 fill-none stroke-white stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">
              {title || "HealthCopilot AI"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {subtitle || "Your health companion"}
            </span>
          </div>
        </button>
      )}

      {/* Right side: Custom action or Notifications & Profile Avatar */}
      {rightAction ? (
        <div>{rightAction}</div>
      ) : (
        <div className="flex items-center space-x-3.5 relative">
          {/* Notification Bell */}
          <button
            onClick={() => setShowNotificationToast(prev => !prev)}
            aria-label="Notifications"
            className="relative p-1 text-slate-500 hover:text-slate-800 transition rounded-full hover:bg-slate-100"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => handleTabChange('profile')}
            aria-label="Open Profile"
            className="w-8 h-8 rounded-full overflow-hidden border border-brand-200 hover:border-brand-500 transition ring-2 ring-transparent hover:ring-brand-100"
          >
            <img
              alt={userProfile.name}
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=Priya+Sharma&background=00A896&color=fff";
              }}
            />
          </button>

          {/* Notifications Toast / Popup */}
          {showNotificationToast && (
            <div className="absolute top-10 right-0 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] text-brand-600 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">1 New</span>
              </div>
              <div className="pt-2 space-y-2">
                <div className="flex items-start space-x-2 text-left p-1.5 rounded-lg hover:bg-slate-50">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-xs font-medium text-slate-800">CBC Report Processed</p>
                    <p className="text-[10px] text-slate-400">14 biomarkers analyzed with normal hemoglobin.</p>
                    <span className="text-[9px] text-slate-400">10m ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
