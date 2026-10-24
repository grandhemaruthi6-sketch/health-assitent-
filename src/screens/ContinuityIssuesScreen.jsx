import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { BottomNav } from '../components/common/BottomNav';

export const ContinuityIssuesScreen = () => {
  const { userProfile, navigateTo } = useApp();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'decisions' | 'grants'
  const [decisionMemory, setDecisionMemory] = useState([]);
  const [grantCode, setGrantCode] = useState(null);
  const [grantExpiresAt, setGrantExpiresAt] = useState(null);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [reviewAction, setReviewAction] = useState('confirmed_intentional');
  const [reviewExplanation, setReviewExplanation] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [doctorPinInput, setDoctorPinInput] = useState('');
  const [isDoctorUnlocked, setIsDoctorUnlocked] = useState(false);

  const patientId = userProfile?.id || 'patient-ramesh-001';

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/issues`);
      const data = await res.json();
      if (data.success) {
        setIssues(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load issues', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDecisionMemory = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/decision-memory`);
      const data = await res.json();
      if (data.success) {
        setDecisionMemory(data.data || []);
      }
    } catch (err) {
      console.warn('Failed to load decision memory', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchDecisionMemory();
  }, [patientId]);

  const handleGenerateGrant = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/grants/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: 'treating_physician' })
      });
      const data = await res.json();
      if (data.success) {
        setGrantCode(data.data.code);
        setGrantExpiresAt(new Date(data.data.expiresAt).toLocaleTimeString());
        setStatusMessage('Grant code generated successfully! Valid for 10 minutes.');
      }
    } catch (err) {
      setStatusMessage('Error generating grant code');
    }
  };

  const handleVerifyDoctorCode = async (e) => {
    e.preventDefault();
    if (!doctorPinInput.trim()) return;
    try {
      const res = await fetch('/api/grants/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: 'dr_reviewer', code: doctorPinInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setIsDoctorUnlocked(true);
        setStatusMessage('Doctor access verified successfully! Clinician review enabled.');
      } else {
        setStatusMessage(data.error?.message || 'Invalid access code');
      }
    } catch (err) {
      setStatusMessage('Error verifying doctor code');
    }
  };

  const handlePatientConfirm = async (issueId) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/patient-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, patientNote: 'Confirmed by patient' })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Thank you! Your confirmation has been recorded.');
        fetchIssues();
      }
    } catch (err) {
      setStatusMessage('Failed to submit confirmation');
    }
  };

  const handleSubmitDoctorReview = async (e) => {
    e.preventDefault();
    if (!selectedIssue || !reviewExplanation.trim()) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: 'dr_treating_physician',
          reviewerRole: 'doctor',
          action: reviewAction,
          explanationText: reviewExplanation.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Review submitted! Issue resolved and Decision Memory saved.');
        setIsDoctorModalOpen(false);
        setSelectedIssue(null);
        setReviewExplanation('');
        fetchIssues();
        fetchDecisionMemory();
      }
    } catch (err) {
      setStatusMessage('Failed to submit review');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden select-none">
      <Header
        title="Continuity Engine"
        subtitle="HealthContinuum AI"
        rightAction={
          <button
            onClick={() => navigateTo('timeline')}
            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95"
          >
            <span>Timeline</span>
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto px-5 pt-3 pb-20 space-y-4">
        {/* Clinician Assistant Safety Banner */}
        <section className="bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
          <span className="text-xl">🛡️</span>
          <div className="text-[11px] text-sky-900 leading-snug">
            <span className="font-bold block">Assists Clinicians — Never Replaces Them</span>
            This engine deterministically flags discrepancies across consecutive visits.
            Missing reasons are verified against available records and never assumed to be clinical error.
          </div>
        </section>

        {statusMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-emerald-600 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'issues'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Detected Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'decisions'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Decision Memory ({decisionMemory.length})
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'grants'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Doctor Access Grant
          </button>
        </div>

        {/* TAB 1: CONTINUITY ISSUES */}
        {activeTab === 'issues' && (
          <section className="space-y-3">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Inspecting continuity records...</div>
            ) : issues.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-2xs space-y-2">
                <span className="text-2xl">✅</span>
                <h3 className="text-sm font-bold text-slate-800">No Continuity Discrepancies</h3>
                <p className="text-xs text-slate-500">All consecutive prescriptions and lab tests align with available clinical records.</p>
              </div>
            ) : (
              issues.map((issue) => {
                const summary = issue.summary_structured || {};
                const isResolved = issue.status === 'resolved';

                return (
                  <article
                    key={issue.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:border-brand-300 transition"
                  >
                    {/* Header Row: Type, Severity, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wide text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
                        {issue.issue_type.replace(/_/g, ' ')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          issue.severity === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          issue.severity === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {issue.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Summary text */}
                    <div className="text-xs text-slate-800 font-medium leading-relaxed">
                      {summary.finding || summary.message || 'Observation across visits'}
                    </div>

                    {/* Side-by-side comparison if available */}
                    {summary.before && summary.after && (
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-semibold">Previous ({summary.before.date})</span>
                          <span className="font-bold text-slate-800">{summary.before.dose || summary.before.frequency || 'Recorded'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-semibold">Subsequent ({summary.after.date})</span>
                          <span className="font-bold text-slate-800">{summary.after.dose || summary.after.frequency || summary.after.status}</span>
                        </div>
                      </div>
                    )}

                    {/* Reason Found vs Not Found Banner */}
                    <div className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                      issue.reason_status === 'documented'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}>
                      <span className="text-sm">
                        {issue.reason_status === 'documented' ? '📄' : '🔍'}
                      </span>
                      <div>
                        <span className="font-bold block">
                          {issue.reason_status === 'documented'
                            ? 'Documented in Records'
                            : 'Not Found in Available Records'}
                        </span>
                        <span className="italic">
                          "{issue.reason_text || 'No documented rationale found in available records'}"
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      {issue.status === 'needs_patient_confirmation' && (
                        <button
                          onClick={() => handlePatientConfirm(issue.id)}
                          className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition active:scale-95"
                        >
                          Confirm Change
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setIsDoctorModalOpen(true);
                        }}
                        className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition active:scale-95"
                      >
                        Clinician Review
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* TAB 2: DECISION MEMORY */}
        {activeTab === 'decisions' && (
          <section className="space-y-3">
            {decisionMemory.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-2xs space-y-2">
                <span className="text-2xl">🧠</span>
                <h3 className="text-sm font-bold text-slate-800">No Recorded Decision Memories</h3>
                <p className="text-xs text-slate-500">Clinician review explanations and intentional justifications will appear here.</p>
              </div>
            ) : (
              decisionMemory.map((dec) => (
                <article key={dec.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-brand-700">{dec.doctor_name || 'Treating Clinician'}</span>
                    <span>{dec.visit_date}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">{dec.finding}</div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs italic">
                    "{dec.documented_reason}"
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* TAB 3: DOCTOR ACCESS GRANTS */}
        {activeTab === 'grants' && (
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Secure 6-Digit Doctor PIN Grant</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate a temporary 10-minute PIN code so your doctor can access and review your continuity discrepancies.
              </p>
            </div>

            <button
              onClick={handleGenerateGrant}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition"
            >
              Generate 6-Digit Access PIN
            </button>

            {grantCode && (
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center space-y-1">
                <span className="text-xs text-teal-700 font-semibold uppercase block">Your 10-Minute Access PIN</span>
                <span className="text-3xl font-mono font-extrabold tracking-widest text-teal-900">{grantCode}</span>
                <span className="text-[10px] text-teal-600 block">Expires at {grantExpiresAt}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Doctor Verification Unlock</h4>
              <form onSubmit={handleVerifyDoctorCode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN"
                  value={doctorPinInput}
                  onChange={(e) => setDoctorPinInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono tracking-wider focus:outline-hidden focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl active:scale-95"
                >
                  Unlock
                </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* Doctor Review Modal */}
      {isDoctorModalOpen && selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Clinician Review</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Provide clinical justification for <span className="font-bold text-slate-800">{selectedIssue.issue_type}</span>:
            </p>

            <form onSubmit={handleSubmitDoctorReview} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Action</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500 bg-white"
                >
                  <option value="confirmed_intentional">Confirmed Intentional</option>
                  <option value="explained">Explained / Rationalized</option>
                  <option value="needs_followup">Needs Follow-up</option>
                  <option value="dismissed">Dismissed (Cosmetic/Noise)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Explanation</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Frequency adjusted to OD due to stable evening glycemic readings..."
                  value={reviewExplanation}
                  onChange={(e) => setReviewExplanation(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-xs"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav activeScreen="continuity" />
    </div>
  );
};
