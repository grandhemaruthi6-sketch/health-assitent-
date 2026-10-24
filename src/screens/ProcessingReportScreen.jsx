import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const ProcessingReportScreen = () => {
  const { uploadProgress, processingStage, uploadFormData, uploadedFile, navigateTo } = useApp();

  const stages = [
    { title: "Uploading", desc: "Securing transfer of document to private vault" },
    { title: "Reading report", desc: "Recognizing printed text, layout, and test panels" },
    { title: "Checking extracted details", desc: "Verifying extracted values and reference ranges" },
    { title: "Preparing simple explanation", desc: "Creating plain-language summary for your doctor visit" }
  ];

  const currentFile = uploadFormData.selectedFile || uploadedFile || { name: "Medical_Report.pdf" };

  return (
    <div className="flex-1 flex flex-col bg-white pb-8 select-none min-h-[720px]">
      <Header
        title="Processing Report"
        showBack={true}
        onBack={() => navigateTo('upload')}
      />

      <main className="flex-1 px-6 pt-5 flex flex-col items-center justify-between text-center max-w-md mx-auto w-full">
        {/* Top Info */}
        <div className="space-y-1.5 w-full">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span>{uploadFormData.reportType?.icon || "📄"}</span>
            <span>{uploadFormData.reportType?.name || "Lab Report"}</span>
            {uploadFormData.hospitalName && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px]">{uploadFormData.hospitalName}</span>
              </>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 pt-1">
            Reading Your Medical Document
          </h2>
          <p className="text-xs text-slate-500 truncate font-medium">
            {currentFile.name}
          </p>
        </div>

        {/* Calm Progress State */}
        <div className="w-full my-6 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
            <svg className="w-8 h-8 stroke-teal-600 stroke-2 fill-none" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>{stages[processingStage]?.title || "Processing..."}</span>
              <span className="text-teal-700 font-mono">{uploadProgress}%</span>
            </div>
            {/* Linear Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-brand-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.max(5, uploadProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-stage Checklist */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3 shadow-2xs">
          {stages.map((stage, idx) => {
            const isCompleted = processingStage > idx || uploadProgress === 100;
            const isCurrent = processingStage === idx && uploadProgress < 100;

            return (
              <div key={stage.title} className="flex items-start space-x-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold ${isCurrent ? 'text-teal-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                    {stage.title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Return to Upload Option */}
        <div className="w-full pt-4">
          <button
            onClick={() => navigateTo('upload')}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium transition py-1"
          >
            Cancel and return to upload
          </button>
        </div>
      </main>
    </div>
  );
};
