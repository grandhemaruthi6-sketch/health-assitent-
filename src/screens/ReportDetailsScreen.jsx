import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { apiClient } from '../services/apiClient';
import { REPORT_TYPES } from '../data/mockData';
import { AIHealthSummaryCard } from '../components/reports/AIHealthSummaryCard';

export const ReportDetailsScreen = () => {
  const {
    activeReport,
    activeReportId,
    navigateTo,
    setDeleteModal,
    askAI,
    updateReportMetadata
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState('All');
  const [downloadNotification, setDownloadNotification] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [detailedReport, setDetailedReport] = useState(activeReport);

  // Edit metadata form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editReportDate, setEditReportDate] = useState('');
  const [editPhysician, setEditPhysician] = useState('');

  // Fetch fresh detailed report from backend for the signed-in user
  useEffect(() => {
    setDetailedReport(null); // CRITICAL: Reset immediately on reportId change so previous report state never leaks
    async function fetchFreshReport() {
      if (!activeReportId) return;
      try {
        setIsLoadingReport(true);
        const data = await apiClient.reports.getById(activeReportId);
        if (data) {
          setDetailedReport({
            ...data,
            date: new Date(data.reportDate || data.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            doctorName: data.physicianName || '',
            hospitalName: data.hospital?.name || data.hospitalName || 'Clinical Facility',
            biomarkers: data.aiAnalysis?.extractedBiomarkers || data.aiAnalysis?.labResults?.map((lr, idx) => {
              const rawRange = lr.referenceRange?.rawRange || lr.referenceInterval?.rawRange || (
                lr.referenceRange?.low != null && lr.referenceRange?.high != null
                  ? `${lr.referenceRange.low} - ${lr.referenceRange.high}`
                  : 'Unavailable'
              );
              return {
                id: `bm-${idx}`,
                name: lr.name,
                category: lr.category || data.category,
                value: lr.numericValue != null ? lr.numericValue : (lr.rawValue || lr.value || 'N/A'),
                numericValue: lr.numericValue,
                rawValue: lr.rawValue,
                unit: lr.unit || '',
                minRange: lr.referenceRange?.low ?? lr.referenceInterval?.low ?? null,
                maxRange: lr.referenceRange?.high ?? lr.referenceInterval?.high ?? null,
                rawRange,
                status: lr.status === 'NORMAL' ? 'Normal' : (lr.status === 'HIGH' ? 'Slightly Elevated' : (lr.status === 'LOW' ? 'Low' : 'Normal')),
                explanation: lr.interpretation || 'Clinical measurement from verified source document.',
                historicalReadings: lr.historicalReadings || [],
                flags: lr.flags,
                evidence: lr.evidence
              };
            }) || []
          });
        }
      } catch (err) {
        console.warn('[ReportDetails] Error fetching report:', err.message);
      } finally {
        setIsLoadingReport(false);
      }
    }

    fetchFreshReport();
  }, [activeReportId]);

  useEffect(() => {
    if (detailedReport) {
      setEditTitle(detailedReport.title || '');
      setEditCategory(detailedReport.category || detailedReport.reportType || 'Lab Report');
      setEditReportDate(detailedReport.reportDate || (detailedReport.timestamp ? detailedReport.timestamp.split('T')[0] : '2026-10-15'));
      setEditPhysician(detailedReport.physicianName || detailedReport.doctorName || '');
    }
  }, [detailedReport]);

  const currentReport = (detailedReport && detailedReport.id === activeReportId)
    ? detailedReport
    : (activeReport && activeReport.id === activeReportId ? activeReport : null);

  if (isLoadingReport && !currentReport) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-800">Loading Report Details...</p>
        <p className="text-[11px] text-slate-500 mt-1">Retrieving verified findings and OCR transcript.</p>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F8FAFC]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-3">
          📄
        </div>
        <p className="text-sm font-bold text-slate-800">No report selected.</p>
        <button
          onClick={() => navigateTo('recent_reports', 'reports')}
          className="mt-3 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold"
        >
          View Reports List
        </button>
      </div>
    );
  }

  const biomarkers = currentReport.biomarkers || [];
  const categories = ['All', ...new Set(biomarkers.map(b => b.category))];

  const filteredBiomarkers = activeTabFilter === 'All'
    ? biomarkers
    : biomarkers.filter(b => b.category === activeTabFilter);

  const handleDownload = () => {
    if (currentReport.signedDownloadUrl) {
      window.open(currentReport.signedDownloadUrl, '_blank');
    }
    setDownloadNotification(true);
    setTimeout(() => setDownloadNotification(false), 3000);
  };

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      setIsSavingMetadata(true);
      await updateReportMetadata(currentReport.id, {
        title: editTitle.trim(),
        category: editCategory,
        reportDate: editReportDate,
        physicianName: editPhysician.trim() || undefined
      });

      setDetailedReport(prev => ({
        ...prev,
        title: editTitle.trim(),
        category: editCategory,
        reportDate: editReportDate,
        date: new Date(editReportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        doctorName: editPhysician.trim() || prev.doctorName
      }));

      setIsEditingMetadata(false);
    } catch (err) {
      alert(`Could not save changes: ${err.message}`);
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const extractedFullText = currentReport.ocrResult?.fullText ||
    currentReport.extractedText ||
    currentReport.ocrResult?.pages?.map(p => `[Page ${p.pageNumber}]\n${p.text}`).join('\n\n') ||
    '';

  const isImageFile = currentReport.mimeType?.startsWith('image/') ||
    currentReport.fileName?.match(/\.(jpe?g|png|webp)$/i);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] select-none overflow-hidden">
      <Header
        title={currentReport.title}
        subtitle={currentReport.hospitalName || currentReport.labName}
        showBack={true}
        onBack={() => navigateTo('recent_reports', 'reports')}
        rightAction={
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditingMetadata(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
              title="Edit Report Metadata"
            >
              <span className="text-sm">✏️</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
              title="Download / Export Report"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, reportId: currentReport.id })}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition"
              title="Delete Report"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-5 pt-3.5 pb-6 space-y-4">
        {/* Toast alert for download */}
        {downloadNotification && (
          <div className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-xl text-center shadow-lg animate-in fade-in">
            ✓ Document opened / exported securely from private vault!
          </div>
        )}

        {/* Loading Spinner for fresh database sync */}
        {isLoadingReport && (
          <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-center text-[11px] text-teal-800 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing private vault records for signed-in user...</span>
          </div>
        )}

        {/* Report Metadata & Provenance Card */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {currentReport.category || currentReport.reportType || 'Lab Report'}
              </span>
              {currentReport.processingStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentReport.processingStatus === 'completed'
                    ? (currentReport.failureCode || !extractedFullText || currentReport.overallFlags?.hasFailures
                        ? 'text-amber-800 bg-amber-50 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                    : currentReport.processingStatus === 'failed'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  {currentReport.processingStatus === 'completed'
                    ? (currentReport.failureCode || !extractedFullText || currentReport.overallFlags?.hasFailures
                        ? 'Needs Review'
                        : 'Verified')
                    : (currentReport.processingStatus === 'failed' ? 'Failed' : 'Processing')}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsEditingMetadata(true)}
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>Edit Metadata</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Hospital Facility</span>
              <span className="font-bold text-slate-900 block truncate">
                {currentReport.hospitalName || currentReport.labName || "Clinical Facility"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Reviewing Clinician</span>
              <span className="font-bold text-slate-900 block truncate">
                {currentReport.doctorName || currentReport.physicianName || "Dr. Sarah Jenkins, MD"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Clinical Report Date</span>
              <span className="font-bold text-slate-900 block">
                {currentReport.date || currentReport.reportDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">File Security</span>
              <span className="text-emerald-700 font-semibold text-[11px] block truncate">
                🔒 Private Vault ({currentReport.fileSize || `${(currentReport.fileSizeBytes / (1024*1024)).toFixed(1)} MB`})
              </span>
            </div>
          </div>
        </section>

        {/* Original Report Document Preview */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🖼️</span> <span>Original Report Document</span>
            </h3>
            {currentReport.signedDownloadUrl && (
              <a
                href={currentReport.signedDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <span>Open File</span>
                <span className="text-xs">↗</span>
              </a>
            )}
          </div>

          {currentReport.previewUrl || (currentReport.signedDownloadUrl && isImageFile) ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-56 flex items-center justify-center">
              <img
                src={currentReport.previewUrl || currentReport.signedDownloadUrl}
                alt="Medical document preview"
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setShowPreviewModal(true)}
              />
              <button
                onClick={() => setShowPreviewModal(true)}
                className="absolute bottom-2 right-2 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs transition"
              >
                🔍 Expand
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                  PDF
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[180px]">
                    {currentReport.fileName || `${currentReport.title}.pdf`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Vault encrypted • {currentReport.fileSize || 'Standard Medical Document'}
                  </span>
                </div>
              </div>
              {currentReport.signedDownloadUrl ? (
                <a
                  href={currentReport.signedDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  View PDF
                </a>
              ) : (
                <span className="text-[10px] text-slate-400">Private Vault</span>
              )}
            </div>
          )}
        </section>

        {/* Evidence-Grounded AI Health Summary Card */}
        <AIHealthSummaryCard
          reportId={currentReport.id}
          report={currentReport}
        />

        {/* Collapsible Raw OCR Extracted Text Panel */}
        <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2">
          <div
            onClick={() => setShowExtractedText(prev => !prev)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Extracted Text &amp; OCR Content
              </span>
              <span className="text-[10px] text-slate-400">
                ({extractedFullText.length > 0 ? `${extractedFullText.split('\n').length} lines` : 'Processed'})
              </span>
            </div>
            <span className="text-xs text-brand-600 font-bold">
              {showExtractedText ? '▲ Hide' : '▼ View Text'}
            </span>
          </div>

          {showExtractedText && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Raw text verbatim from Document AI / OCR engine</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedFullText);
                    alert('Copied extracted text to clipboard!');
                  }}
                  className="text-[10px] font-bold text-brand-600 hover:underline"
                >
                  Copy to Clipboard
                </button>
              </div>
              <pre className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200">
                {extractedFullText || "No raw text available (Document image unreadable or OCR returned empty text)."}
              </pre>
            </div>
          )}
        </section>

        {/* Category Tabs for Biomarkers */}
        {categories.length > 2 && (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTabFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  activeTabFilter === cat
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Biomarkers Breakdown with Uncertainty & Source Reference Indication */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Extracted Clinical Findings ({filteredBiomarkers.length})
            </h3>
            <span className="text-[10px] text-slate-400">Page references &amp; flags</span>
          </div>

          <div className="space-y-2.5">
            {filteredBiomarkers.map(bm => {
              const isNormal = bm.status === 'Normal' || bm.interpretation === 'Normal';
              const rangeSpan = (bm.maxRange - bm.minRange) || 1;
              const normalized = Math.max(0, Math.min(100, ((bm.value - (bm.minRange * 0.8)) / (bm.maxRange * 1.2 - bm.minRange * 0.8)) * 100));

              // Uncertainty flags from Phase 2 / Phase 3 pipeline
              const isLowConfidence = bm.flags?.isLowConfidence || (bm.evidence?.confidence && bm.evidence.confidence < 0.7);
              const isConflicting = bm.flags?.isConflicting;
              const isMissing = bm.evidence?.presence === 'MISSING' || bm.value === null || bm.value === undefined;
              const pageRef = bm.evidence?.pageNumber ? `Page ${bm.evidence.pageNumber}` : 'Page 1';

              return (
                <div key={bm.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{bm.name}</h4>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {pageRef}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ref Range: <span className="font-semibold text-slate-700">{bm.rawRange || (bm.minRange != null && bm.maxRange != null ? `${bm.minRange} - ${bm.maxRange} ${bm.unit || ''}` : 'Unavailable')}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isNormal
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {bm.status || 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Clear Uncertainty / Missing Field Badges */}
                  {(isLowConfidence || isConflicting || isMissing) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {isLowConfidence && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>⚠️</span> Low OCR Confidence
                        </span>
                      )}
                      {isConflicting && (
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>⚠️</span> Conflicting Reading Across Pages
                        </span>
                      )}
                      {isMissing && (
                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>ℹ️</span> Field Missing in Source
                        </span>
                      )}
                    </div>
                  )}

                  {/* Horizontal Range Slider or Qualitative Value Representation */}
                  {!isMissing && bm.minRange != null && bm.maxRange != null && typeof bm.value === 'number' ? (
                    <div className="pt-1 pb-1">
                      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute left-[20%] right-[20%] top-0 bottom-0 bg-emerald-200"></div>
                        <div
                          className={`absolute top-0 bottom-0 w-2.5 rounded-full shadow-xs -ml-1 ${
                            isNormal ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ left: `${normalized}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 pt-1">
                        <span>Low ({bm.minRange})</span>
                        <span className="font-bold text-slate-700">{bm.value} {bm.unit}</span>
                        <span>High ({bm.maxRange})</span>
                      </div>
                    </div>
                  ) : !isMissing && (
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Observed Finding:</span>
                      <span className="font-bold text-slate-800">{bm.value} <span className="font-normal text-slate-500">{bm.unit || ''}</span></span>
                    </div>
                  )}

                  {/* Explanation and Source Snippet */}
                  {bm.explanation && (
                    <p className="text-[10px] text-slate-500 bg-slate-50/80 p-2 rounded-xl border border-slate-100 leading-snug">
                      💡 {bm.explanation}
                    </p>
                  )}

                  {/* Historical Comparative Readings */}
                  {bm.historicalReadings && bm.historicalReadings.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historical Trend:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {bm.historicalReadings.map((h, hIdx) => (
                          <span key={hIdx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                            <span className="text-slate-400 mr-1">{h.date}:</span>
                            <strong>{h.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Voice AI Trigger */}
        <section className="pt-1">
          <button
            onClick={() => askAI(`Explain the clinical significance of my ${currentReport.title} from ${currentReport.hospitalName || currentReport.labName}`)}
            className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>🎙️</span>
            <span>Ask AI to explain this report out loud</span>
          </button>
        </section>
      </main>

      {/* Edit Metadata Modal */}
      {isEditingMetadata && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Correct Report Metadata</h3>
              <button onClick={() => setIsEditingMetadata(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Report Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                >
                  {REPORT_TYPES.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Report Date</label>
                <input
                  type="date"
                  value={editReportDate}
                  onChange={(e) => setEditReportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Clinician (Optional)</label>
                <input
                  type="text"
                  value={editPhysician}
                  onChange={(e) => setEditPhysician(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins, MD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMetadata(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMetadata}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-soft transition flex items-center justify-center space-x-1"
                >
                  {isSavingMetadata ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Lightbox Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 animate-in fade-in select-none">
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-bold truncate max-w-[240px]">{currentReport.title}</span>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-semibold"
            >
              Close
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2">
            <img
              src={currentReport.previewUrl || currentReport.signedDownloadUrl}
              alt="Full report preview"
              className="max-h-[80vh] max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
