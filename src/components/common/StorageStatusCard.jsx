import React from 'react';
import { useApp } from '../../context/AppContext';

export const StorageStatusCard = ({ compact = false }) => {
  const { storageStatus, navigateTo } = useApp();

  const percentage = Math.min(100, Math.round((parseFloat(storageStatus.usedMB) / storageStatus.totalLimitMB) * 100));

  if (compact) {
    return (
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-brand-600 flex items-center justify-center font-bold text-xs">
            💾
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Encrypted Medical Vault</span>
            <span className="text-[10px] text-slate-400">
              {storageStatus.usedMB} MB of {storageStatus.totalLimitMB} MB used ({percentage}%)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Encrypted
        </span>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3" data-purpose="storage-status-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-brand-500 flex items-center justify-center text-xs shadow-2xs">
            💾
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Medical Records Storage</h3>
            <span className="text-[10px] text-slate-400">{storageStatus.vaultStatus}</span>
          </div>
        </div>
        <span className="text-xs font-bold text-brand-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
          {storageStatus.usedMB} / {storageStatus.totalLimitMB} MB
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-sky-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(8, percentage)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{storageStatus.reportsCount} PDF Reports • {storageStatus.biomarkersCount} Biomarkers</span>
          <span>{100 - percentage}% available</span>
        </div>
      </div>

      {/* Quick Action */}
      <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-50">
        <span className="text-slate-400">{storageStatus.lastBackup}</span>
        <button
          onClick={() => navigateTo('upload')}
          className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <span>+ Upload Report</span>
        </button>
      </div>
    </section>
  );
};
