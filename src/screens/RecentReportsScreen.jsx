import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { StorageStatusCard } from '../components/common/StorageStatusCard';

export const RecentReportsScreen = () => {
  const {
    reports,
    viewReport,
    navigateTo,
    setDeleteModal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Hematology', 'Cardiology', 'Endocrinology'];

  const filtered = reports.filter(r => {
    const facility = (r.hospitalName || r.labName || '').toLowerCase();
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      <Header
        title="Medical Reports"
        rightAction={
          <button
            onClick={() => navigateTo('upload')}
            className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-xs transition active:scale-95 text-lg font-bold"
            title="Upload New Report"
          >
            +
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-20 space-y-4">
        {/* Storage Status Card */}
        <StorageStatusCard />

        {/* Search Input Box */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by title or diagnostic lab..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-2xs"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Archived Documents ({filtered.length})
            </span>
            <button
              onClick={() => navigateTo('upload')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              + Ingest New
            </button>
          </div>

          {filtered.length > 0 ? (
            filtered.map(report => (
              <div
                key={report.id}
                onClick={() => viewReport(report.id)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:border-brand-300 transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center font-black text-[10px] shrink-0">
                      PDF
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{report.title}</h3>
                      <p className="text-[11px] text-slate-400">{report.labName} • {report.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {report.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs text-slate-500">
                  <span className="text-[11px]">
                    🧬 <span className="font-semibold text-slate-700">{report.biomarkers?.length || report.biomarkersCount || 14}</span> biomarkers
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ isOpen: true, reportId: report.id });
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Report"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="text-brand-600 font-semibold text-xs flex items-center gap-0.5">
                      View Details <span className="text-sm">›</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 space-y-2">
              <p className="text-xs text-slate-500 font-medium">No reports found matching your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Clear Search Filter
              </button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
