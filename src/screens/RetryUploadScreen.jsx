import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const RetryUploadScreen = () => {
  const { navigateTo, executeDocumentAnalysis, hospitals } = useApp();

  const handleRetryWithSample = async () => {
    const sampleBlob = new Blob([
      `PATIENT MEDICAL REPORT - COMPREHENSIVE LAB PANEL
Patient: Priya Sharma
Date: 2026-10-15
Facility: Apollo Hospital, Bangalore
Department: Clinical Pathology & Hematology
Test: Complete Blood Count (CBC)
- Hemoglobin: 13.8 g/dL [Normal: 12.0 - 15.5]
- White Blood Cells: 6,800 /uL [Normal: 4,500 - 11,000]
- Platelet Count: 245,000 /uL [Normal: 150,000 - 450,000]
- Fasting Blood Sugar: 94 mg/dL [Normal: 70 - 99]
Summary: All hematological and metabolic parameters within standard healthy reference limits.`
    ], { type: 'text/plain' });
    const sampleFile = new File([sampleBlob], "CBC_Metropolis_Clear_Scan.txt", { type: 'text/plain' });

    await executeDocumentAnalysis(sampleFile, {
      hospitalId: hospitals[0]?.id || 'hosp-apollo',
      hospitalName: hospitals[0]?.name || 'Apollo Hospital',
      category: 'Lab Report',
      date: '2026-10-15'
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-white px-7 pt-6 pb-8 select-none min-h-[720px] text-center">
      <Header
        title="Upload Unsuccessful"
        showBack={true}
        onBack={() => navigateTo('upload')}
      />

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Warning Badge */}
        <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-500 mb-5 shadow-xl shadow-rose-500/10">
          <svg className="w-10 h-10 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Document Couldn't Be Processed
        </h1>
        <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed">
          The image was blurry, truncated, or low resolution. Our clinical OCR could not verify reference numbers with high confidence.
        </p>

        {/* Diagnostic Tips Card */}
        <div className="w-full mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5">
          <span className="text-[11px] font-bold text-slate-800 block">
            Tips for successful recognition:
          </span>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Ensure all 4 corners of the paper are visible</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Avoid strong glare or shadows over tables</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-500">✓</span>
              <span>Upload official lab PDF exports whenever possible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 pt-4">
        <button
          onClick={() => navigateTo('upload')}
          className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-sm rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4 stroke-white stroke-[2.5]" fill="none" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Try Uploading Again</span>
        </button>

        <button
          onClick={handleRetryWithSample}
          className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-bold transition"
        >
          Use Clean Sample File Instead
        </button>
      </div>
    </div>
  );
};
