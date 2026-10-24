import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { StorageStatusCard } from '../components/common/StorageStatusCard';

export const HomeDashboardScreen = () => {
  const {
    userProfile,
    hospitals,
    reports,
    navigateTo,
    viewReport,
    setPermissionModal,
    setIsAddHospitalModalOpen,
    resetUploadFlow,
    openHospitalDetails,
    isLoadingBackend
  } = useApp();

  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const profileName = userProfile?.name?.trim() ? userProfile.name.split(' ')[0] : 'there';

  const handleStartUpload = () => {
    resetUploadFlow();
    navigateTo('upload');
  };

  const latestReport = reports[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] select-none overflow-hidden">
      {/* Top Header */}
      <Header subtitle="Your health companion" />

      {/* Main Dashboard Content - Scrollable between Header and fixed BottomNav */}
      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-6 space-y-4" data-purpose="main-dashboard-content">
        {/* Welcome Greeting with Animated AI Doctor / Assistant Symbol */}
        <section data-purpose="welcome-greeting" className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              {greetingTime}, {profileName}! <span>👋</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
              Your health journey, made simpler.
            </p>
          </div>

          {/* Animated AI Assistant/Doctor Symbol - Tapping opens AI Chat */}
          <button
            onClick={() => navigateTo('voice_processing')}
            aria-label="Open AI Doctor Assistant Chat"
            title="Open HealthCopilot AI Chat"
            className="relative group p-2 rounded-2xl bg-gradient-to-tr from-teal-500 via-[#00A896] to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white shadow-md shadow-teal-500/25 transition transform hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
          >
            <div className="relative">
              <span className="text-xl leading-none">🩺</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
          </button>
        </section>



        {/* BEGIN: Continuity Engine Discrepancy Card */}
        <section
          onClick={() => navigateTo('continuity')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs hover:border-brand-400 cursor-pointer transition active:scale-[0.99] flex items-center justify-between"
          data-purpose="continuity-engine-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-lg shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900">Continuity Engine</h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Detects dosage changes, lab shifts &amp; missing reports across visits.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-600">Review ›</span>
        </section>
        {/* END: Continuity Engine Discrepancy Card */}

        {/* BEGIN: Visited Hospitals Responsive 2-Column Grid */}
        <section className="space-y-2.5" data-purpose="visited-hospitals-section">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Visited Hospitals
              </h3>
              <p className="text-[10px] text-slate-400">
                {hospitals.length === 0 ? 'No clinics registered yet' : `${hospitals.length} clinical centers & labs`}
              </p>
            </div>
            {hospitals.length > 0 && (
              <button
                onClick={() => navigateTo('timeline', 'timeline')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition"
              >
                Timeline view ›
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingBackend ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 min-h-[118px] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-100 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded-md w-3/4 mb-1.5"></div>
                <div className="h-2 bg-slate-100 rounded-md w-1/2"></div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 min-h-[118px] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-100 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded-md w-3/4 mb-1.5"></div>
                <div className="h-2 bg-slate-100 rounded-md w-1/2"></div>
              </div>
            </div>
          ) : (
            /* Responsive 2-Column Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Actual Visited Hospitals */}
              {hospitals.map(hosp => (
                <div
                  key={hosp.id}
                  onClick={() => openHospitalDetails(hosp.id)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-brand-300 transition cursor-pointer flex flex-col justify-between min-h-[118px] group active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-brand-600 flex items-center justify-center text-sm shadow-2xs">
                      {hosp.icon || '🏥'}
                    </div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {hosp.reportCount || 0} {hosp.reportCount === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition leading-snug line-clamp-1">
                      {hosp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Latest: <span className="text-slate-600 font-medium">{hosp.latestVisitDate || 'No recorded visits'}</span>
                    </p>
                  </div>
                </div>
              ))}

              {/* Action Card: Add hospital */}
              <div
                onClick={() => setIsAddHospitalModalOpen(true)}
                className="bg-gradient-to-br from-teal-50/70 to-emerald-50/70 p-3.5 rounded-2xl border border-dashed border-teal-300 hover:border-teal-500 transition cursor-pointer flex flex-col justify-between min-h-[118px] active:scale-98 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-teal-600 flex items-center justify-center text-base font-bold shadow-2xs group-hover:bg-teal-500 group-hover:text-white transition">
                  +
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-teal-950 leading-snug">
                    Add Hospital
                  </h4>
                  <p className="text-[10px] text-teal-700 mt-0.5 font-medium">
                    Register a hospital or clinic
                  </p>
                </div>
              </div>

              {/* Action Card: Upload report */}
              <div
                onClick={handleStartUpload}
                className="bg-gradient-to-br from-sky-50/70 to-blue-50/70 p-3.5 rounded-2xl border border-dashed border-sky-300 hover:border-sky-500 transition cursor-pointer flex flex-col justify-between min-h-[118px] active:scale-98 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-sky-600 flex items-center justify-center text-base font-bold shadow-2xs group-hover:bg-sky-500 group-hover:text-white transition">
                  📄
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-sky-950 leading-snug">
                    Upload Report
                  </h4>
                  <p className="text-[10px] text-sky-700 mt-0.5 font-medium">
                    Add a medical record
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
        {/* END: Visited Hospitals Responsive 2-Column Grid */}

        {/* Live Storage Status Card */}
        <StorageStatusCard compact={true} />

        {/* Recent Activity Section */}
        <section className="space-y-2 pb-2" data-purpose="recent-activity-section">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Activity</h3>
            <button
              onClick={() => navigateTo('recent_reports', 'reports')}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition"
            >
              View All
            </button>
          </div>

          {latestReport ? (
            <div
              onClick={() => viewReport(latestReport.id)}
              className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between cursor-pointer hover:border-brand-300 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-tight">PDF</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{latestReport.title}</h4>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span>{latestReport.hospitalName || latestReport.labName}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">
                      {latestReport.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-1 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-500">No reports uploaded yet.</p>
              <button
                onClick={handleStartUpload}
                className="mt-2 text-xs font-bold text-brand-600 hover:underline"
              >
                Upload your first report
              </button>
            </div>
          )}
        </section>
      </main>

      {/* iOS Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};
