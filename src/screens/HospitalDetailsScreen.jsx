import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { apiClient } from '../services/apiClient';

export const HospitalDetailsScreen = () => {
  const {
    selectedHospitalId,
    hospitals,
    navigateTo,
    viewReport,
    setUploadFormData,
    setUploadStep
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospitalVisits, setHospitalVisits] = useState([]);
  const [selectedVisitDate, setSelectedVisitDate] = useState(null);

  const hospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || null;

  useEffect(() => {
    async function loadHospitalData() {
      if (!hospital) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Fetch fresh timeline data to get all visits and attached reports
        const timeline = await apiClient.timeline.getTimeline();
        // Filter visits matching this hospital
        const matchingVisits = (timeline || []).filter(
          v => v.hospitalId === hospital.id || v.hospitalName === hospital.name
        );
        setHospitalVisits(matchingVisits);
        if (matchingVisits.length > 0) {
          setSelectedVisitDate(matchingVisits[0].visitDate);
        }
      } catch (err) {
        console.warn('[HospitalDetails] Error loading visits:', err);
        setError('Could not fetch visit history for this hospital.');
      } finally {
        setLoading(false);
      }
    }

    loadHospitalData();
  }, [hospital?.id, hospital?.name]);

  const handleStartUploadForHospital = () => {
    if (hospital) {
      setUploadFormData(prev => ({
        ...prev,
        hospitalId: hospital.id,
        hospitalName: hospital.name
      }));
      setUploadStep(1);
      navigateTo('upload');
    }
  };

  if (!hospital) {
    return (
      <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-[720px] select-none">
        <Header title="Hospital Details" showBack={true} onBack={() => navigateTo('home', 'home')} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-3">
            🏥
          </div>
          <h3 className="text-sm font-bold text-slate-800">Hospital Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">Please select a valid hospital from the dashboard.</p>
          <button
            onClick={() => navigateTo('home', 'home')}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Filter reports by selected visit date if one is selected
  const activeVisit = hospitalVisits.find(v => v.visitDate === selectedVisitDate) || null;
  const reportsForSelectedVisit = activeVisit?.reports || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] select-none overflow-hidden">
      <Header
        title={hospital.name}
        subtitle={hospital.location || hospital.branch || "Clinical Facility"}
        showBack={true}
        onBack={() => navigateTo('home', 'home')}
        rightAction={
          <button
            onClick={handleStartUploadForHospital}
            className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-xs text-sm font-bold transition active:scale-95"
            title="Upload Report for this Hospital"
          >
            +
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-3.5 pb-6 space-y-4">
        {/* Hospital Summary Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-brand-600 flex items-center justify-center text-2xl shadow-2xs shrink-0">
              {hospital.icon || "🏥"}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-sm font-bold text-slate-900 leading-snug">
                {hospital.name}
              </h2>
              {hospital.branch && (
                <p className="text-xs font-medium text-teal-700 mt-0.5">
                  Branch: {hospital.branch}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">
                📍 {hospital.location || "Registered Clinical Facility"}
              </p>
              {hospital.department && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {hospital.department}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">Total Recorded Visits</span>
              <span className="text-xs font-bold text-slate-800">
                {hospitalVisits.length} {hospitalVisits.length === 1 ? 'Visit' : 'Visits'}
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">Archived Reports</span>
              <span className="text-xs font-bold text-slate-800">
                {hospital.reportCount || hospitalVisits.reduce((acc, v) => acc + (v.reports?.length || 0), 0)} Reports
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 space-y-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500">Loading verified visit records...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-rose-700 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Empty State when no visits exist for this hospital */}
        {!loading && !error && hospitalVisits.length === 0 && (
          <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-brand-600 flex items-center justify-center text-xl mx-auto">
              📅
            </div>
            <h4 className="text-xs font-bold text-slate-800">No Visits Recorded for this Hospital</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Upload a lab report, discharge summary, or prescription from {hospital.name} to start your timeline history.
            </p>
            <button
              onClick={handleStartUploadForHospital}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Upload Medical Report for this Hospital
            </button>
          </div>
        )}

        {/* Grouped Visits by Date */}
        {!loading && !error && hospitalVisits.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Visits Grouped by Date ({hospitalVisits.length})
              </h3>
              <span className="text-[10px] text-slate-400">Tap date to filter reports</span>
            </div>

            {/* Visit Date Selector Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
              {hospitalVisits.map(v => {
                const isSelected = selectedVisitDate === v.visitDate;
                const formattedDate = new Date(v.visitDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <button
                    key={v.visitId || v.visitDate}
                    onClick={() => setSelectedVisitDate(isSelected ? null : v.visitDate)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>📅</span>
                    <span>{formattedDate}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {v.reports?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Showing reports for selected visit date */}
            {selectedVisitDate && activeVisit ? (
              <div className="space-y-3 pt-1">
                <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">
                      Visit on {new Date(activeVisit.visitDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {activeVisit.physicianName ? `Clinician: ${activeVisit.physicianName}` : 'Routine Clinical Encounter'}
                    </p>
                    {activeVisit.reasonForVisit && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{activeVisit.reasonForVisit}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedVisitDate(null)}
                    className="text-[11px] text-brand-700 font-bold hover:underline"
                  >
                    Show All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {reportsForSelectedVisit.length > 0 ? (
                    reportsForSelectedVisit.map(rep => (
                      <div
                        key={rep.id}
                        onClick={() => viewReport(rep.id)}
                        className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-brand-300 transition cursor-pointer flex items-center justify-between group active:scale-98"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-brand-600 flex items-center justify-center text-sm font-bold shrink-0">
                            📄
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition leading-snug">
                              {rep.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {rep.category} • Date: {rep.reportDate || activeVisit.visitDate}
                            </p>
                            {rep.aiSummary && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                {rep.aiSummary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {rep.processingStatus === 'completed' ? 'Verified' : rep.processingStatus}
                          </span>
                          <span className="text-brand-600 font-bold text-xs flex items-center justify-end mt-1">
                            View ›
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No reports directly attached to this visit date.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* All visits list if no single date is selected */
              <div className="space-y-3 pt-1">
                {hospitalVisits.map(v => (
                  <div
                    key={v.visitId || v.visitDate}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(v.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          {v.reports?.length || 0} Reports
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedVisitDate(v.visitDate)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        Filter to date ›
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {v.physicianName ? `Physician: ${v.physicianName}` : 'Clinical Consultation'}
                      {v.visitDepartment ? ` • ${v.visitDepartment}` : ''}
                    </p>

                    {v.reports && v.reports.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {v.reports.map(r => (
                          <div
                            key={r.id}
                            onClick={() => viewReport(r.id)}
                            className="p-2.5 bg-slate-50 hover:bg-teal-50/60 rounded-xl transition cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                              {r.title}
                            </span>
                            <span className="text-brand-600 font-semibold text-[11px] shrink-0">
                              View Details ›
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
