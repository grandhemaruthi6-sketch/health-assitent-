import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';
import { TIMELINE_EVENTS } from '../data/mockData';

export const HealthTimelineScreen = () => {
  const { viewReport, navigateTo, timelineEvents } = useApp();
  const [filterType, setFilterType] = useState('All');
  const [expandedEventId, setExpandedEventId] = useState('tl-1');

  const filterTabs = ['All', 'Lab Report', 'Clinical Visit', 'Prescription'];

  const events = timelineEvents || TIMELINE_EVENTS;
  const filteredEvents = filterType === 'All'
    ? events
    : events.filter(e => e.type === filterType);

  const toggleExpand = (id) => {
    setExpandedEventId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      <Header
        title="Health Timeline"
        rightAction={
          <button
            onClick={() => navigateTo('trend_chart')}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
          >
            <span>📊</span>
            <span>View Trends</span>
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-20 space-y-4">
        {/* Intro Summary Banner */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">Chronological Medical Journey</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Continuous medical events &amp; diagnosis history</p>
            </div>
            <span className="text-[11px] font-bold text-brand-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {events.length} Milestones
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Lab Tests</span>
              <span className="text-xs font-bold text-slate-800">3 Reports</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Consults</span>
              <span className="text-xs font-bold text-slate-800">1 Routine</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block">Protocols</span>
              <span className="text-xs font-bold text-slate-800">1 Regimen</span>
            </div>
          </div>
        </section>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                filterType === tab
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {tab === 'All' ? 'All Milestones' : tab}
            </button>
          ))}
        </div>

        {/* Animated Vertical Timeline or Genuine Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-brand-600 flex items-center justify-center text-xl">
              📅
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Timeline Milestones Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your chronological medical journey will show your hospital visits, diagnostic tests, and doctor consultations.
            </p>
            <button
              onClick={() => navigateTo('upload')}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              + Upload First Medical Document
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:via-sky-400 before:to-slate-200">
            {filteredEvents.map((event, idx) => {
              const isClickable = !!event.reportId;
              const isExpanded = expandedEventId === event.id;

              return (
                <div
                  key={event.id}
                  className="relative group transition-all duration-300"
                >
                {/* Animated Pulsing Node on Timeline */}
                <div className={`absolute -left-[23px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-xs transition-all duration-300 ${
                  event.badgeColor === 'teal'
                    ? 'bg-brand-500 ring-4 ring-teal-100'
                    : event.badgeColor === 'sky'
                    ? 'bg-sky-500 ring-4 ring-sky-100'
                    : 'bg-amber-500 ring-4 ring-amber-100'
                }`}>
                  {idx === 0 && (
                    <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-75"></span>
                  )}
                </div>

                {/* Event Card */}
                <div
                  onClick={() => toggleExpand(event.id)}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
                    isExpanded
                      ? 'border-brand-300 shadow-soft ring-1 ring-brand-100'
                      : 'border-slate-100 shadow-2xs hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {event.date}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      event.badgeColor === 'teal'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : event.badgeColor === 'sky'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {event.badge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition">
                        {event.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {event.facility}
                      </p>
                    </div>
                    <span className="text-slate-400 text-xs transition transform">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 leading-snug">
                    {event.description}
                  </p>

                  {/* Expanded Additional Details */}
                  {isExpanded && isClickable && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between animate-in fade-in duration-200">
                      <span className="text-[10px] text-slate-500">
                        📄 Full diagnostic breakdown available
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewReport(event.reportId);
                        }}
                        className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Open Report</span>
                        <span>›</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>

      <BottomNav />
    </div>
  );
};
