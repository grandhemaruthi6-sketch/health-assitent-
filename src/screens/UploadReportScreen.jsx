import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { REPORT_TYPES } from '../data/mockData';

export const UploadReportScreen = () => {
  const {
    navigateTo,
    uploadStep,
    setUploadStep,
    uploadFormData,
    setUploadFormData,
    executeDocumentAnalysis,
    isAnalyzing
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // STEP 1: Select Report Type
  const handleSelectType = (type) => {
    setUploadFormData(prev => ({ ...prev, reportType: type }));
  };

  // STEP 2: Handle File Drop / Select & Preview
  const handleFile = (file) => {
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    let previewUrl = null;
    if (isImg) {
      previewUrl = URL.createObjectURL(file);
    }

    setUploadFormData(prev => ({
      ...prev,
      selectedFile: {
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        rawFile: file
      },
      filePreviewUrl: previewUrl
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sampleName, sampleSize, sampleType) => {
    handleFile({
      name: sampleName,
      size: sampleSize,
      type: sampleType || "application/pdf"
    });
  };

  // Step 2 Camera Capture Simulation
  const handleCaptureCamera = () => {
    setIsCameraActive(false);
    const photoDoc = {
      name: `${uploadFormData.reportType?.name || 'Medical'}_Scan_${Date.now().toString().slice(-4)}.jpg`,
      size: 2100000,
      type: "image/jpeg"
    };
    handleFile(photoDoc);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] pb-10 select-none min-h-[720px]">
      <Header
        title="Upload Medical Record"
        subtitle={`Step ${uploadStep} of 3`}
        showBack={true}
        onBack={() => {
          if (uploadStep > 1) setUploadStep(s => s - 1);
          else navigateTo('home', 'home');
        }}
      />

      {/* Progress Step Bar */}
      <div className="px-5 pt-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
          <span className={uploadStep >= 1 ? 'text-brand-600' : ''}>1. Type</span>
          <span className={uploadStep >= 2 ? 'text-brand-600' : ''}>2. Document</span>
          <span className={uploadStep >= 3 ? 'text-brand-600' : ''}>3. AI Analysis</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(uploadStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="flex-1 px-5 pt-4 space-y-4">
        {/* ============================================== */}
        {/* STEP 1: CHOOSE REPORT TYPE                      */}
        {/* ============================================== */}
        {uploadStep === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Choose report type</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pick whether you are uploading a structured Lab Report or a handwritten Prescription.
              </p>
            </div>

            {/* Step 2: Primary Route Selector (Lab report vs Prescription) */}
            <div className="p-1 bg-slate-200/80 rounded-2xl flex items-center space-x-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  const labType = REPORT_TYPES.find(t => t.id === 'lab') || REPORT_TYPES[0];
                  handleSelectType(labType);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 ${
                  uploadFormData.reportType?.id === 'lab'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-base">🧪</span>
                <span>Lab Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rxType = REPORT_TYPES.find(t => t.id === 'prescription') || REPORT_TYPES[2];
                  handleSelectType(rxType);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 ${
                  uploadFormData.reportType?.id === 'prescription'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-base">💊</span>
                <span>Prescription</span>
              </button>
            </div>

            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                All Document Categories
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {REPORT_TYPES.map(type => {
                const isSelected = uploadFormData.reportType?.id === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between min-h-[105px] group active:scale-95 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{type.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-700 transition leading-tight">
                        {type.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {type.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setUploadStep(2)}
              className="w-full mt-4 py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-soft transition flex items-center justify-center space-x-2"
            >
              <span>Continue to Document Selection</span>
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ============================================== */}
        {/* STEP 2: SELECT DOCUMENT & PREVIEW               */}
        {/* ============================================== */}
        {uploadStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-brand-700 font-bold mb-1">
                <span>{uploadFormData.reportType?.icon}</span>
                <span>{uploadFormData.reportType?.name}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Select &amp; Preview Document</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a real PDF or medical image, or scan with camera.
              </p>
            </div>

            {/* Document Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition ${
                dragActive
                  ? 'border-brand-500 bg-teal-50/80 scale-[1.01]'
                  : 'border-slate-300 bg-white hover:border-brand-400'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-500 mb-2 shadow-2xs">
                <svg className="w-6 h-6 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 className="text-xs font-bold text-slate-800">
                {uploadFormData.selectedFile ? uploadFormData.selectedFile.name : "Drag & drop PDF / image here"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PDF, JPG, PNG up to 15MB
              </p>

              <input
                id="report-file-doc-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                }}
                className="hidden"
              />

              <div className="flex items-center space-x-2 mt-3">
                <label
                  htmlFor="report-file-doc-input"
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition active:scale-95"
                >
                  {uploadFormData.selectedFile ? "Replace File" : "Choose File"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCameraActive(true)}
                  className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl transition active:scale-95 border border-teal-200/60"
                >
                  📷 Camera Scan
                </button>
              </div>
            </div>

            {/* Document Preview Card if selected */}
            {uploadFormData.selectedFile && (
              <div className="bg-white rounded-2xl p-3.5 border border-teal-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    Document Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(uploadFormData.selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                {uploadFormData.filePreviewUrl ? (
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                    <img
                      src={uploadFormData.filePreviewUrl}
                      alt="Medical Document Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] bg-black/70 text-white px-2 py-0.5 rounded">
                      Document Image
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {uploadFormData.selectedFile.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        ✓ Ready for clinical OCR extraction
                      </span>
                    </div>
                  </div>
                )}

                {/* Replacement and Removal Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <label
                    htmlFor="report-file-doc-input"
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄</span> <span>Replace File</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFormData(prev => ({
                        ...prev,
                        selectedFile: null,
                        filePreviewUrl: null
                      }));
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <span>🗑️</span> <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Sample Presets */}
            {!uploadFormData.selectedFile && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Or load a sample document:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleSampleSelect("CBC_Metropolis_April2025.pdf", 2450000)}
                    className="p-2.5 bg-white hover:bg-teal-50 text-slate-700 rounded-xl border border-slate-200 text-left font-medium shadow-2xs"
                  >
                    📄 Sample CBC (PDF)
                  </button>
                  <button
                    onClick={() => handleSampleSelect("Urine_Routine_Examination_Oct2026.pdf", 1450000)}
                    className="p-2.5 bg-white hover:bg-teal-50 text-slate-700 rounded-xl border border-slate-200 text-left font-medium shadow-2xs"
                  >
                    🧪 Sample Urinalysis (PDF)
                  </button>
                  <button
                    onClick={() => handleSampleSelect("Lipid_Profile_October2026.pdf", 1850000)}
                    className="p-2.5 bg-white hover:bg-teal-50 text-slate-700 rounded-xl border border-slate-200 text-left font-medium shadow-2xs"
                  >
                    🩺 Sample Lipid Panel (PDF)
                  </button>
                  <button
                    onClick={() => handleSampleSelect("Chest_XRay_Digital_Scan.jpg", 1850000, "image/jpeg")}
                    className="p-2.5 bg-white hover:bg-teal-50 text-slate-700 rounded-xl border border-slate-200 text-left font-medium shadow-2xs"
                  >
                    🩻 Sample X-Ray (JPG)
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={executeDocumentAnalysis}
              disabled={!uploadFormData.selectedFile || isAnalyzing}
              className={`w-full py-3.5 font-semibold text-xs rounded-xl shadow-soft transition flex items-center justify-center space-x-2 ${
                uploadFormData.selectedFile && !isAnalyzing
                  ? 'bg-brand-500 hover:bg-brand-600 text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isAnalyzing ? "Analyzing Document..." : "Analyze & Auto-detect Details"}</span>
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

      </main>

      {/* Simulated Camera Viewfinder Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col justify-between p-4 animate-in fade-in select-none">
          <div className="flex items-center justify-between text-white pt-3">
            <button
              onClick={() => setIsCameraActive(false)}
              className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full"
            >
              Cancel
            </button>
            <span className="text-xs font-bold tracking-wide">Document Scanner</span>
            <div className="w-12"></div>
          </div>

          <div className="relative w-full max-w-xs mx-auto aspect-[3/4] border-2 border-dashed border-teal-400 rounded-3xl overflow-hidden flex flex-col items-center justify-center bg-slate-900/60 shadow-2xl">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-bounce"></div>
            <div className="p-4 bg-black/40 rounded-2xl text-center backdrop-blur-xs text-white max-w-[200px]">
              <span className="text-xs font-bold block mb-1">Align Document</span>
              <span className="text-[10px] text-slate-300">Position all 4 corners in frame</span>
            </div>
          </div>

          <div className="flex flex-col items-center pb-6 space-y-2">
            <button
              onClick={handleCaptureCamera}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-teal-600 text-xl font-bold">
                📷
              </div>
            </button>
            <span className="text-xs text-white/80">Tap to capture report</span>
          </div>
        </div>
      )}
    </div>
  );
};
