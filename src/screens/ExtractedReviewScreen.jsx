import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const ExtractedReviewScreen = () => {
  const { extractedDraft, setExtractedDraft, confirmExtractedDraft, navigateTo } = useApp();
  
  // Tab / Filter State
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Biomarker Edit State (Lab Reports)
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Dates Edit State
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [tempVisitDate, setTempVisitDate] = useState(extractedDraft?.visitDate || '');
  const [tempReportDate, setTempReportDate] = useState(extractedDraft?.reportDate || '');
  const [dateValidationError, setDateValidationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);

  useEffect(() => {
    setTempVisitDate(extractedDraft?.visitDate || '');
    setTempReportDate(extractedDraft?.reportDate || '');
    setDateValidationError('');
    setSaveError('');
  }, [extractedDraft?.id, extractedDraft?.visitDate, extractedDraft?.reportDate]);

  // Prescription View State
  const [editingMedIndex, setEditingMedIndex] = useState(null);
  const [medFormData, setMedFormData] = useState({
    drug_name: '',
    strength: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  const isPrescription = extractedDraft?.category === 'Prescription' || extractedDraft?.reportType === 'Prescription';
  const isUnreadable = extractedDraft?.processingStatus === 'UNREADABLE_PRESCRIPTION' || 
    (isPrescription && (!extractedDraft?.medications || extractedDraft.medications.length === 0));

  const medications = extractedDraft?.medications || [];
  const biomarkers = extractedDraft?.biomarkers || [];

  // =========================================================================
  // LAB REPORT HANDLERS
  // =========================================================================
  const categories = ['All', ...new Set(biomarkers.map(b => b.category))];
  const filteredBiomarkers = activeCategory === 'All'
    ? biomarkers
    : biomarkers.filter(b => b.category === activeCategory);

  const handleStartEditBiomarker = (item) => {
    setEditingItem(item);
    setEditValue(item.value !== undefined && item.value !== null ? item.value.toString() : '');
  };

  const handleSaveEditBiomarker = () => {
    if (!editingItem) return;
    const num = parseFloat(editValue);
    const updated = biomarkers.map(b => {
      if (b.id === editingItem.id) {
        let status = b.status;
        if (!isNaN(num) && b.minRange != null && b.maxRange != null) {
          if (num > b.maxRange) status = 'Slightly Elevated';
          else if (num < b.minRange) status = 'Low';
          else status = 'Normal';
        }
        return {
          ...b,
          value: !isNaN(num) ? num : editValue,
          rawValue: editValue,
          status,
          flags: {
            ...b.flags,
            needsUserReview: false,
            reviewReason: 'User verified/adjusted value'
          }
        };
      }
      return b;
    });

    if (extractedDraft) {
      setExtractedDraft({ ...extractedDraft, biomarkers: updated });
    }
    setEditingItem(null);
  };

  // =========================================================================
  // PRESCRIPTION MEDICATION HANDLERS (Step 4 & Step 5)
  // =========================================================================
  const handleStartEditMed = (med, index) => {
    setEditingMedIndex(index);
    setMedFormData({
      drug_name: med.drug_name || med.name || '',
      strength: med.strength || '',
      dose: med.dose || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      instructions: med.instructions || med.instructionsAsWritten || ''
    });
    setIsAddingMed(false);
  };

  const handleSaveMed = () => {
    if (!medFormData.drug_name.trim()) return;

    const updatedMeds = [...medications];
    const medPayload = {
      id: editingMedIndex !== null ? updatedMeds[editingMedIndex]?.id || `med-${Date.now()}` : `med-${Date.now()}`,
      name: medFormData.drug_name.trim(),
      drug_name: medFormData.drug_name.trim(),
      drugName: medFormData.drug_name.trim(),
      strength: medFormData.strength.trim() || null,
      dose: medFormData.dose.trim() || null,
      dosage: medFormData.strength.trim() || medFormData.dose.trim() || null,
      frequency: medFormData.frequency.trim() || null,
      route: 'Oral',
      duration: medFormData.duration.trim() || null,
      instructions: medFormData.instructions.trim() || null,
      instructionsAsWritten: `${medFormData.drug_name} ${medFormData.strength} ${medFormData.dose} ${medFormData.frequency} ${medFormData.duration} ${medFormData.instructions}`.replace(/\s+/g, ' ').trim(),
      evidence: {
        presence: 'EXPLICIT',
        pageNumber: 1,
        rawSnippet: medFormData.drug_name,
        confidence: 1.0
      },
      flags: {
        isConflicting: false,
        isLowConfidence: false,
        needsUserReview: false,
        reviewReason: 'User entered/verified'
      }
    };

    if (editingMedIndex !== null) {
      updatedMeds[editingMedIndex] = medPayload;
    } else {
      updatedMeds.push(medPayload);
    }

    setExtractedDraft({
      ...extractedDraft,
      medications: updatedMeds,
      processingStatus: 'completed'
    });

    setEditingMedIndex(null);
    setIsAddingMed(false);
    setMedFormData({ drug_name: '', strength: '', dose: '', frequency: '', duration: '', instructions: '' });
  };

  const handleDeleteMed = (index) => {
    const updatedMeds = medications.filter((_, idx) => idx !== index);
    setExtractedDraft({
      ...extractedDraft,
      medications: updatedMeds
    });
  };

  const formatReviewDate = value => {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0)
      : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSaveDates = () => {
    if (!tempVisitDate || !tempReportDate) {
      setDateValidationError('Both the clinical encounter date and report date are required. Please check the printed dates on the document.');
      return;
    }
    setExtractedDraft(prev => prev ? ({
      ...prev,
      visitDate: tempVisitDate,
      reportDate: tempReportDate,
      isDateUncertain: false,
      isVisitDateUncertain: false,
      date: formatReviewDate(tempReportDate)
    }) : prev);
    setDateValidationError('');
    setIsEditingDates(false);
  };

  const handlePrimaryConfirm = async () => {
    if (!extractedDraft?.reportDate || !extractedDraft?.visitDate || extractedDraft?.isDateUncertain || extractedDraft?.isVisitDateUncertain) {
      setTempVisitDate(extractedDraft?.visitDate || '');
      setTempReportDate(extractedDraft?.reportDate || '');
      setDateValidationError('');
      setIsEditingDates(true);
      return;
    }

    const draftToSave = isPrescription
      ? { ...extractedDraft, status: 'user_verified', processingStatus: 'user_verified' }
      : extractedDraft;
    setIsSavingReport(true);
    setSaveError('');
    try {
      await confirmExtractedDraft(draftToSave);
    } catch (error) {
      setSaveError(error?.message || 'Could not save this report. Please try again.');
    } finally {
      setIsSavingReport(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] pb-8 select-none min-h-[720px]">
      <Header
        title={isPrescription ? "Prescription Verification" : "Extracted Results Review"}
        showBack={true}
        onBack={() => navigateTo('success')}
      />

      <main className="flex-1 px-4 sm:px-5 pt-3 space-y-3.5 max-w-4xl mx-auto w-full">
        {/* Banner with Hospital & Date Tag */}
        <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-xs">
            {isPrescription ? '💊' : '✓'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-xs font-bold text-slate-900 truncate">
              {extractedDraft?.hospitalName || "Facility not identified"}
            </h2>
            {(extractedDraft?.patientName || extractedDraft?.patientAge || extractedDraft?.patientSex) && (
              <p className="text-[11px] text-slate-700 mt-1">
                <span className="font-semibold">Patient:</span> {extractedDraft?.patientName || 'Name not detected'}
                {extractedDraft?.patientAge ? ` • ${extractedDraft.patientAge}` : ''}
                {extractedDraft?.patientSex ? ` • ${extractedDraft.patientSex}` : ''}
              </p>
            )}
            <div className="text-[11px] text-teal-800 font-medium space-y-0.5 mt-0.5">
              <p>
                <span className="font-semibold text-teal-900">Encounter Date:</span> {extractedDraft?.visitDate || "Not recorded"}
              </p>
              <p>
                <span className="font-semibold text-teal-900">{isPrescription ? 'Prescription Date:' : 'Specimen/Report Date:'}</span> {extractedDraft?.reportDate ? new Date(extractedDraft.reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not detected (Requires confirmation)"}
              </p>
              <p className="text-[10px] text-teal-600">
                Category: <b>{extractedDraft?.category}</b> • {isPrescription ? `${medications.length} medication(s)` : `${biomarkers.length} biomarker(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTempVisitDate(extractedDraft?.visitDate || '');
              setTempReportDate(extractedDraft?.reportDate || '');
              setIsEditingDates(true);
            }}
            className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-[10px] font-bold text-teal-800 hover:bg-teal-100"
          >
            Edit Dates
          </button>
        </div>

        {/* Date Uncertainty Confirmation Banner */}
        {extractedDraft?.isDateUncertain && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2.5">
            <span className="text-amber-600 text-base">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-[11px]">Date Confirmation Requested</p>
              <p className="text-[10px] text-amber-800 mt-0.5">
                The clinical report date was not detected with high confidence in the document text. Please confirm the dates above before saving.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PRESCRIPTION HUMAN REVIEW SECTION (Step 4 & Step 5)                */}
        {/* ================================================================= */}
        {isPrescription ? (
          <div className="space-y-4">
            {/* Step 5: Failure Banner if OCR could not read clearly */}
            {isUnreadable && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-900 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-rose-800">
                    We couldn't read this prescription clearly
                  </h3>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  The handwriting or image resolution did not yield reliable automated text. Your original prescription image is displayed below so you can easily type in your medications manually.
                </p>
              </div>
            )}

            {/* Split Screen / Side-by-Side: Original Prescription Image & Extracted Medications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Original Prescription Image Viewer */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <span>📄</span>
                    <span>Prescription Source Document</span>
                  </span>
                  <button
                    onClick={() => setImageExpanded(v => !v)}
                    className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md"
                  >
                    {imageExpanded ? 'Collapse' : '🔍 Enlarge'}
                  </button>
                </div>

                <div className={`relative rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center transition-all duration-300 ${
                  imageExpanded ? 'max-h-[500px]' : 'max-h-[220px]'
                }`}>
                  {extractedDraft?.previewUrl ? (
                    <img
                      src={extractedDraft.previewUrl}
                      alt="Prescription Document"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setImageExpanded(v => !v)}
                    />
                  ) : (
                    <div className="p-8 text-center space-y-2">
                      <span className="text-3xl">📝</span>
                      <p className="text-xs font-semibold text-slate-600">Prescription Scan Attached</p>
                      <p className="text-[10px] text-slate-400">
                        {extractedDraft?.title || "Prescription Document"}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 text-center italic">
                  Compare extracted medications with your prescription photo above.
                </p>
              </div>

              {/* Right Column: Medications List with Needs Review Highlights */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Extracted Medications ({medications.length})
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingMed(true);
                      setEditingMedIndex(null);
                      setMedFormData({ drug_name: '', strength: '', dose: '', frequency: '', duration: '', instructions: '' });
                    }}
                    className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 border border-brand-200"
                  >
                    <span>➕</span>
                    <span>Add Medication</span>
                  </button>
                </div>

                {medications.length === 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                    <span className="text-2xl">💊</span>
                    <p className="text-xs font-bold text-slate-700">No medications entered yet</p>
                    <p className="text-[11px] text-slate-400">
                      Tap "Add Medication" above to enter your prescribed medicine from the photo.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {medications.map((med, idx) => {
                    const needsReview = med.flags?.needsUserReview;
                    return (
                      <div
                        key={med.id || idx}
                        className={`rounded-2xl p-3.5 border transition shadow-2xs space-y-2 ${
                          needsReview
                            ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-300/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Drug Name & Badges */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h4 className="text-xs font-extrabold text-slate-900">
                                {med.drug_name || med.name}
                              </h4>
                              {med.strength && (
                                <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                                  {med.strength}
                                </span>
                              )}
                              {needsReview && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                                  <span>⚠️</span>
                                  <span>Needs Review</span>
                                </span>
                              )}
                            </div>

                            {/* Needs Review reason explanation */}
                            {needsReview && med.flags?.reviewReason && (
                              <p className="text-[10px] font-semibold text-amber-800 mt-1 bg-amber-100/60 p-1.5 rounded-lg border border-amber-200">
                                ⚠️ {med.flags.reviewReason}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleStartEditMed(med, idx)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                              title="Edit medication"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteMed(idx)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition"
                              title="Delete medication"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Structured Fields Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block font-semibold">Dose:</span>
                            <span className="font-bold text-slate-700">{med.dose || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Frequency:</span>
                            <span className="font-bold text-slate-700">{med.frequency || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Duration:</span>
                            <span className="font-bold text-slate-700">{med.duration || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Instructions:</span>
                            <span className="font-bold text-slate-700">{med.instructions || "—"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal: Edit or Add Medication (Step 4 & Step 5) */}
            {(editingMedIndex !== null || isAddingMed) && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs">
                      {editingMedIndex !== null ? 'Edit Medication' : 'Add Medication'}
                    </h4>
                    <button
                      onClick={() => { setEditingMedIndex(null); setIsAddingMed(false); }}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Drug Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={medFormData.drug_name}
                        onChange={(e) => setMedFormData({ ...medFormData, drug_name: e.target.value })}
                        placeholder="e.g. Amoxicillin, Metformin"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Strength</label>
                        <input
                          type="text"
                          value={medFormData.strength}
                          onChange={(e) => setMedFormData({ ...medFormData, strength: e.target.value })}
                          placeholder="e.g. 500mg, 10mcg"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Dose</label>
                        <input
                          type="text"
                          value={medFormData.dose}
                          onChange={(e) => setMedFormData({ ...medFormData, dose: e.target.value })}
                          placeholder="e.g. 1 tablet, 5ml"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Frequency</label>
                        <input
                          type="text"
                          value={medFormData.frequency}
                          onChange={(e) => setMedFormData({ ...medFormData, frequency: e.target.value })}
                          placeholder="e.g. 1-0-1, Twice daily (BD)"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={medFormData.duration}
                          onChange={(e) => setMedFormData({ ...medFormData, duration: e.target.value })}
                          placeholder="e.g. 5 days, 1 month"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Instructions</label>
                      <input
                        type="text"
                        value={medFormData.instructions}
                        onChange={(e) => setMedFormData({ ...medFormData, instructions: e.target.value })}
                        placeholder="e.g. After food, at bedtime"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {dateValidationError && <p role="alert" className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{dateValidationError}</p>}
              <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => { setEditingMedIndex(null); setIsAddingMed(false); }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMed}
                      disabled={!medFormData.drug_name.trim()}
                      className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-soft"
                    >
                      Save Medication
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* LAB REPORT REVIEW SECTION (UNTOUCHED BIOMARKER FLOW)               */
          /* ================================================================= */
          <div className="space-y-3.5">
            {/* Filter Pills */}
            {categories.length > 2 && (
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      activeCategory === cat
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Empty State if no biomarkers found */}
            {biomarkers.length === 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-xs font-bold text-slate-800">No Structured Lab Biomarkers</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  This document is categorized as <b>{extractedDraft?.category}</b>. Clinical text and general findings have been archived with full source traceability.
                </p>
              </div>
            )}

            {/* Biomarkers List with Exact Unit & Range Binding */}
            <div className="space-y-2">
              {filteredBiomarkers.map(bm => {
                const isNormal = bm.status === 'Normal';
                const displayRange = bm.rawRange || (bm.minRange != null && bm.maxRange != null ? `${bm.minRange} - ${bm.maxRange} ${bm.unit || ''}` : 'Unavailable');

                return (
                  <div
                    key={bm.id}
                    onClick={() => handleStartEditBiomarker(bm)}
                    className={`bg-white p-3 rounded-xl border shadow-2xs hover:border-brand-200 cursor-pointer transition flex items-center justify-between active:scale-98 ${
                      bm.flags?.needsUserReview ? 'border-amber-300 bg-amber-50/20' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-bold text-slate-900">{bm.name}</h3>
                        <span className="text-[10px] text-slate-400">({bm.category})</span>
                        {bm.evidence?.pageNumber && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            p.{bm.evidence.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Ref Range: <span className="font-semibold text-slate-700">{displayRange}</span>
                      </p>
                      {bm.flags?.needsUserReview && (
                        <p className="text-[9px] text-amber-700 font-medium mt-0.5">
                          ⚠️ {bm.flags.reviewReason || 'Low scan confidence • Tap to review'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 text-right shrink-0">
                      <div>
                        <span className="text-sm font-bold text-slate-800">
                          {bm.value} <span className="text-[10px] font-normal text-slate-500">{bm.unit}</span>
                        </span>
                        <span className={`block text-[10px] font-bold ${
                          isNormal ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {bm.status}
                        </span>
                      </div>
                      <span className="text-slate-300 hover:text-slate-600 text-xs">✏️</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit Biomarker Value Modal */}
            {editingItem && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Edit {editingItem.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reference: {editingItem.rawRange || (editingItem.minRange != null && editingItem.maxRange != null ? `${editingItem.minRange} - ${editingItem.maxRange}` : 'Unavailable')} {editingItem.unit || ''}
                    </p>
                    {editingItem.evidence?.rawSnippet && (
                      <p className="text-[10px] text-slate-400 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                        Source text: <i>"{editingItem.evidence.rawSnippet}"</i> (Page {editingItem.evidence.pageNumber})
                      </p>
                    )}
                  </div>

                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Observed value"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
                  />

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEditBiomarker}
                      className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl"
                    >
                      Save Value
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Edit Modal */}
        {isEditingDates && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Confirm Document Dates</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the actual clinical encounter and report dates printed on the record.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clinical Encounter Visit Date
                  </label>
                  <input
                    type="date"
                    value={tempVisitDate}
                    onChange={(e) => setTempVisitDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Specimen / Document Report Date
                  </label>
                  <input
                    type="date"
                    value={tempReportDate}
                    onChange={(e) => setTempReportDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setIsEditingDates(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDates}
                  className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl"
                >
                  Confirm Dates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Confirmation Action */}
        <div className="pt-3">
          <button
            onClick={handlePrimaryConfirm}
            disabled={isSavingReport}
            className="w-full py-3.5 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-soft transition flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>
              {isSavingReport ? 'Saving report securely…' : (isPrescription
                ? `Confirm Prescription (${medications.length} meds verified) & Save`
                : `Save to ${extractedDraft?.hospitalName || "Hospital Record"} & View Details`)}
            </span>
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {saveError && <p role="alert" className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mt-2">{saveError}</p>}
          {isPrescription && (
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              🔒 Prescriptions are stored as <b>user_verified</b>. No medication reminders or alerts are scheduled without your explicit confirmation.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
