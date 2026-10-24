import React from 'react';
import { useApp } from '../context/AppContext';

export const ErrorStateScreen = () => {
  const { handleTabChange, ocrError, navigateTo, resetUploadFlow } = useApp();

  const isOcrError = !!ocrError;
  const isCredentialsMissing = ocrError?.code === 'CREDENTIALS_MISSING';

  return (
    <div className="flex-1 flex flex-col justify-between bg-white px-7 pt-10 pb-8 select-none min-h-[720px] text-center">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Error icon badge */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg ${
          isCredentialsMissing
            ? 'bg-amber-50 border-4 border-amber-200 text-amber-600'
            : 'bg-rose-50 border-4 border-rose-200 text-rose-500'
        }`}>
          {isCredentialsMissing ? (
            <svg className="w-10 h-10 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg className="w-10 h-10 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {isCredentialsMissing
            ? "OCR Provider Credentials Required"
            : isOcrError
            ? "OCR Processing Issue"
            : "Something went wrong"}
        </h1>

        <p className="text-xs text-slate-500 mt-2 max-w-[300px] leading-relaxed">
          {isCredentialsMissing
            ? "Google Cloud Document AI is integrated on the backend, but live cloud processing is waiting for your GCP project configuration."
            : ocrError?.message || "We encountered a temporary processing issue. Your medical records remain intact."}
        </p>

        {/* Diagnostics block */}
        <div className="w-full mt-5 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
            <span className="text-[10px] uppercase font-bold text-slate-400">Error Diagnostic</span>
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {ocrError?.code || 'ERR_GENERIC'}
            </span>
          </div>

          {isCredentialsMissing && (
            <div className="text-[11px] text-slate-600 space-y-1 pt-1 font-mono">
              <span className="font-bold text-slate-800 font-sans block">Required in .env:</span>
              <p>• GCP_PROJECT_ID</p>
              <p>• GCP_PROCESSOR_ID</p>
              <p>• GOOGLE_APPLICATION_CREDENTIALS</p>
              <p className="pt-1 text-[10px] font-sans text-slate-500">
                Setup guide: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">docs/ocr_setup_guide.md</code>
              </p>
            </div>
          )}

          {!isCredentialsMissing && ocrError?.details && (
            <p className="text-[11px] font-mono text-slate-500 truncate">
              {typeof ocrError.details === 'string' ? ocrError.details : JSON.stringify(ocrError.details)}
            </p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full space-y-2.5 pt-4">
        <button
          onClick={() => {
            resetUploadFlow();
            navigateTo('upload');
          }}
          className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-soft transition"
        >
          Try Another Document
        </button>
        <button
          onClick={() => handleTabChange('home')}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
