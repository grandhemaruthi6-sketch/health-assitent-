import React from 'react';
import { useApp } from '../context/AppContext';

export const DeleteReportDialog = ({ standalone = false }) => {
  const { deleteModal, setDeleteModal, deleteReport, reports, navigateTo } = useApp();

  const targetReport = reports.find(r => r.id === deleteModal.reportId) || reports[0];

  const handleConfirm = () => {
    if (targetReport) {
      deleteReport(targetReport.id);
    }
  };

  const handleCancel = () => {
    setDeleteModal({ isOpen: false, reportId: null });
    if (standalone) {
      navigateTo('recent_reports', 'reports');
    }
  };

  if (!deleteModal.isOpen && !standalone) return null;

  return (
    <div className={`${standalone ? 'flex-1 flex flex-col justify-center items-center p-6 bg-slate-900/60' : 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in'}`}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Red Warning Trash Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-50 border-4 border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md shadow-rose-500/10">
          <svg className="w-8 h-8 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">
            Delete this medical report?
          </h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            This will permanently remove <span className="font-semibold text-slate-800">"{targetReport?.title || 'Selected Report'}"</span> and its biomarkers from your timeline and trend graphs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            Yes, Delete Permanently
          </button>
          <button
            onClick={handleCancel}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Cancel and Keep Report
          </button>
        </div>
      </div>
    </div>
  );
};
