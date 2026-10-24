import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { StorageStatusCard } from '../components/common/StorageStatusCard';

export const ProfilePrivacyScreen = () => {
  const { userProfile, setUserProfile, setCurrentScreen, setReports, logoutUser } = useApp();
  const [copiedNotification, setCopiedNotification] = useState(false);

  const togglePrivacySetting = (key) => {
    setUserProfile(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: !prev.privacySettings[key]
      }
    }));
  };

  const handleExportData = () => {
    setCopiedNotification("Data export initiated! Your encrypted archive will download in seconds.");
    setTimeout(() => setCopiedNotification(false), 3500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      <Header title="Profile & Privacy" />

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-20 space-y-4">
        {copiedNotification && (
          <div className="bg-emerald-600 text-white text-xs px-3.5 py-2.5 rounded-xl text-center shadow-lg animate-in fade-in">
            {copiedNotification}
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-200 shrink-0">
            <img
              alt={userProfile.name}
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=Priya+Sharma&background=00A896&color=fff";
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900">{userProfile.name}</h2>
            <p className="text-xs text-slate-400">{userProfile.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[10px] font-bold text-brand-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Blood Group {userProfile.bloodGroup}
              </span>
              <span className="text-[10px] text-slate-400">
                Age {userProfile.age}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Status */}
        <StorageStatusCard />

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>🚨</span> Emergency Contact
          </h3>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800">{userProfile.emergencyContact.name}</span>
              <span className="text-[10px] text-slate-400 block">{userProfile.emergencyContact.relation}</span>
            </div>
            <a
              href={`tel:${userProfile.emergencyContact.phone}`}
              className="text-xs font-bold text-brand-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
            >
              {userProfile.emergencyContact.phone}
            </a>
          </div>
        </div>

        {/* Tour & Onboarding Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-900">App Onboarding &amp; Experience</h3>
          <button
            onClick={() => setCurrentScreen('splash')}
            className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 transition text-left flex items-center justify-between"
          >
            <span>🎬 Replay Splash &amp; Onboarding Tour</span>
            <span className="text-teal-600">›</span>
          </button>
        </div>

        {/* Privacy & Governance Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Privacy &amp; Data Security
          </h3>

          {/* Toggle 1: End-to-End Encryption */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-slate-900 block">End-to-End Encryption</span>
              <span className="text-[10px] text-slate-400">AES-256 on device and in transit</span>
            </div>
            <button
              onClick={() => togglePrivacySetting('e2eEncryption')}
              className={`w-10 h-6 rounded-full transition p-0.5 ${
                userProfile.privacySettings.e2eEncryption ? 'bg-brand-500' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${
                userProfile.privacySettings.e2eEncryption ? 'translate-x-4' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Toggle 2: HIPAA Consent */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-slate-900 block">HIPAA Compliant Vault</span>
              <span className="text-[10px] text-slate-400">Protected health data isolation</span>
            </div>
            <button
              onClick={() => togglePrivacySetting('hipaaConsent')}
              className={`w-10 h-6 rounded-full transition p-0.5 ${
                userProfile.privacySettings.hipaaConsent ? 'bg-brand-500' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${
                userProfile.privacySettings.hipaaConsent ? 'translate-x-4' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          {/* Toggle 3: AI Training Opt-Out */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-bold text-slate-900 block">AI Model Training Opt-Out</span>
              <span className="text-[10px] text-slate-400">Never use data to train public models</span>
            </div>
            <button
              onClick={() => togglePrivacySetting('aiTrainingOptOut')}
              className={`w-10 h-6 rounded-full transition p-0.5 ${
                userProfile.privacySettings.aiTrainingOptOut ? 'bg-brand-500' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition transform ${
                userProfile.privacySettings.aiTrainingOptOut ? 'translate-x-4' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Data Ownership & Export */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-900">Data Ownership</h3>
          
          <button
            onClick={handleExportData}
            className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition text-left flex items-center justify-between"
          >
            <span>📦 Download My Complete Health Archive (JSON)</span>
            <span className="text-slate-400">›</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all stored reports and reset the demo?")) {
                setReports([]);
                setCurrentScreen('empty_state');
              }
            }}
            className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition text-left flex items-center justify-between"
          >
            <span>🗑️ Delete All Medical Records</span>
            <span className="text-rose-400">›</span>
          </button>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={() => logoutUser()}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            Log Out
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
