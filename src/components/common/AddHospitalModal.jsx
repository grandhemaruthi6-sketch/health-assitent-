import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const AddHospitalModal = () => {
  const { isAddHospitalModalOpen, setIsAddHospitalModalOpen, addHospital } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAddHospitalModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Hospital name is required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await addHospital({
        name: name.trim(),
        location: location.trim() || undefined,
        branch: branch.trim() || undefined,
        department: department.trim() || undefined
      });
      setName('');
      setLocation('');
      setBranch('');
      setDepartment('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add hospital');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header Icon */}
        <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-lg shadow-xs">
            🏥
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Register Hospital / Clinic</h3>
            <p className="text-[11px] text-slate-400">Add a medical center to your private records</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital / Clinic Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apollo Multispeciality Hospital"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none transition"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch (Optional)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Main Campus"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jubilee Hills"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department / Specialty (Optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Clinical Pathology / Cardiology"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none transition"
            />
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddHospitalModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-soft transition flex items-center justify-center space-x-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Save Hospital</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
