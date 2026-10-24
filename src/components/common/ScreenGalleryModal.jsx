import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SCREEN_INVENTORY = [
  // Category: Onboarding & Auth
  { id: 'splash', label: '1. Splash Screen', category: 'Onboarding & Auth', badge: 'Entry' },
  { id: 'onboarding_1', label: '2. Onboarding 1 - Lab Reports', category: 'Onboarding & Auth', badge: '1/3' },
  { id: 'onboarding_2', label: '3. Onboarding 2 - AI Questions', category: 'Onboarding & Auth', badge: '2/3' },
  { id: 'onboarding_3', label: '4. Onboarding 3 - Health Over Time', category: 'Onboarding & Auth', badge: '3/3' },
  { id: 'login', label: '5. Login Screen', category: 'Onboarding & Auth', badge: 'Auth' },

  // Category: Core Tabs
  { id: 'home', label: '6. Home Dashboard', category: 'Core App', badge: 'Tab 1' },
  { id: 'recent_reports', label: '12. Recent Reports List', category: 'Core App', badge: 'Tab 2' },
  { id: 'timeline', label: '13. Health Timeline', category: 'Core App', badge: 'Tab 3' },
  { id: 'hospital_details', label: 'Hospital Visits & History', category: 'Core App', badge: 'Visits' },
  { id: 'profile', label: '15. Profile & Privacy Settings', category: 'Core App', badge: 'Tab 4' },

  // Category: Upload & Processing
  { id: 'upload', label: '7. Upload Medical Report', category: 'Upload & Analysis', badge: 'Action' },
  { id: 'processing', label: '8. Processing Report (OCR)', category: 'Upload & Analysis', badge: 'Progress' },
  { id: 'success', label: '9. Success State (Report Processed)', category: 'Upload & Analysis', badge: 'Success' },
  { id: 'extracted_review', label: '10. Extracted Results Review', category: 'Upload & Analysis', badge: 'Editable' },
  { id: 'report_details', label: '11. Detailed Report Breakdown', category: 'Upload & Analysis', badge: 'Details' },
  { id: 'retry_upload', label: '18. Retry State - Upload Failed', category: 'Upload & Analysis', badge: 'Retry' },

  // Category: Analytics & Comparison
  { id: 'trend_chart', label: '14. Health Results Trend Chart', category: 'Analytics & Trends', badge: 'Charts' },
  { id: 'design_system', label: '24. Design Tokens & Comparison', category: 'Analytics & Trends', badge: 'Design System' },

  // Category: Voice AI Assistant
  { id: 'voice_processing', label: '22. Voice Assistant - Processing', category: 'Voice AI', badge: 'Listening' },
  { id: 'voice_answer', label: '21. Voice Assistant - Answer', category: 'Voice AI', badge: 'Voice QA' },
  { id: 'mic_permission', label: '23. Permission Denied - Microphone', category: 'Voice AI', badge: 'Permission' },

  // Category: States & Modals
  { id: 'empty_state', label: '16. Empty State - No Reports', category: 'States & Modals', badge: 'Empty' },
  { id: 'loading_state', label: '17. Loading State - Skeleton', category: 'States & Modals', badge: 'Skeleton' },
  { id: 'error_state', label: '19. Error State - Something Went Wrong', category: 'States & Modals', badge: 'Error' },
  { id: 'delete_dialog', label: '20. Confirmation Dialog - Delete', category: 'States & Modals', badge: 'Dialog' }
];

export const ScreenGalleryModal = () => {
  const { showScreenGallery, setShowScreenGallery, setCurrentScreen, currentScreen } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (!showScreenGallery) return null;

  const categories = ['All', 'Onboarding & Auth', 'Core App', 'Upload & Analysis', 'Analytics & Trends', 'Voice AI', 'States & Modals'];

  const filtered = selectedCategory === 'All'
    ? SCREEN_INVENTORY
    : SCREEN_INVENTORY.filter(s => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
              <h3 className="font-bold text-slate-900 text-lg">Stitch Screen Navigator</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All 24 Stitch project screens audited and fully interactive
            </p>
          </div>
          <button
            onClick={() => setShowScreenGallery(false)}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Screen Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh]">
          {filtered.map(screen => {
            const isActive = currentScreen === screen.id;
            return (
              <button
                key={screen.id}
                onClick={() => {
                  setCurrentScreen(screen.id);
                  setShowScreenGallery(false);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                  isActive
                    ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-brand-300 bg-white hover:bg-slate-50/80 text-slate-800'
                }`}
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">{screen.category}</span>
                  <span className="text-sm font-bold group-hover:text-brand-600 transition">{screen.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {screen.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Stitch Project ID: 8067101260611218120</span>
          <span>Click any screen to test directly</span>
        </div>
      </div>
    </div>
  );
};
