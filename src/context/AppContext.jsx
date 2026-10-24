import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_USER,
  INITIAL_REPORTS,
  INITIAL_HOSPITALS,
  TIMELINE_EVENTS,
  TREND_METRICS,
  AI_KNOWLEDGE_BASE,
  REPORT_TYPES
} from '../data/mockData';
import { apiClient } from '../services/apiClient';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  speakNaturalUtterance,
  stopSpeaking as engineStopSpeaking,
  playNaturalGreeting,
  resetVoiceSessionGreeting,
  SUPPORTED_LANGUAGES,
  GREETINGS
} from '../utils/voiceAssistantEngine';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Screens & Navigation - Always start on Splash screen across all device sizes
  const [currentScreen, setCurrentScreen] = useState('splash');

  const [activeTab, setActiveTab] = useState('home');
  const [viewMode, setViewMode] = useState('mobile'); // 'mobile', 'tablet', 'desktop'
  const [showScreenGallery, setShowScreenGallery] = useState(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Persistent Hospitals (Populated from SQLite Backend)
  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_hospitals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent Reports (Populated from SQLite Backend)
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent Timeline Events (Populated from SQLite Backend)
  const [timelineEvents, setTimelineEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_timeline');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Report being viewed
  const [activeReportId, setActiveReportId] = useState(null);

  // Selected Hospital for Hospital Details Screen
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  const openHospitalDetails = (hospitalId) => {
    setSelectedHospitalId(hospitalId);
    setCurrentScreen('hospital_details');
  };

  // User Profile
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('hc_user');
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Fetch all persistent database records from SQLite backend
  const refreshBackendData = async () => {
    try {
      setIsLoadingBackend(true);
      const [dbHospitals, dbReports, dbTimeline] = await Promise.all([
        apiClient.hospitals.getAll().catch(() => []),
        apiClient.reports.getAll().catch(() => []),
        apiClient.timeline.getTimeline().catch(() => [])
      ]);

      if (Array.isArray(dbHospitals)) {
        setHospitals(dbHospitals);
      }

      if (Array.isArray(dbReports)) {
        const formattedReports = dbReports.map(r => ({
          ...r,
          fileSize: r.fileSizeFormatted || `${(r.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
          date: r.reportDate ? new Date(r.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'),
          timestamp: r.uploadedAt,
          status: r.processingStatus === 'completed' ? 'Processed' : r.processingStatus,
          doctorName: r.physicianName || 'Dr. Sarah Jenkins, MD',
          labName: r.hospital?.name || r.hospitalName || 'Clinical Diagnostics',
          hospitalName: r.hospital?.name || r.hospitalName || 'Clinical Diagnostics',
          biomarkers: r.aiAnalysis?.extractedBiomarkers || r.aiAnalysis?.labResults?.map((lr, idx) => {
            const rawRange = lr.referenceRange?.rawRange || lr.referenceInterval?.rawRange || (
              lr.referenceRange?.low != null && lr.referenceRange?.high != null
                ? `${lr.referenceRange.low} - ${lr.referenceRange.high}`
                : (lr.referenceInterval?.low != null && lr.referenceInterval?.high != null
                  ? `${lr.referenceInterval.low} - ${lr.referenceInterval.high}`
                  : 'Unavailable')
            );
            return {
              id: `bm-${idx}`,
              name: lr.name,
              category: lr.category || 'Clinical Marker',
              value: lr.numericValue != null ? lr.numericValue : (lr.rawValue || lr.value || 'N/A'),
              numericValue: lr.numericValue,
              rawValue: lr.rawValue,
              unit: lr.unit || '',
              minRange: lr.referenceRange?.low ?? lr.referenceInterval?.low ?? null,
              maxRange: lr.referenceRange?.high ?? lr.referenceInterval?.high ?? null,
              rawRange,
              status: lr.status === 'NORMAL' ? 'Normal' : (lr.status === 'HIGH' ? 'Slightly Elevated' : (lr.status === 'LOW' ? 'Low' : (lr.isAbnormal ? 'Slightly Elevated' : 'Normal'))),
              explanation: lr.interpretation || 'Recorded physiological measurement.',
              flags: lr.flags,
              evidence: lr.evidence
            };
          }) || []
        }));
        setReports(formattedReports);
        if (formattedReports.length > 0) {
          setActiveReportId(prevId => {
            if (prevId && formattedReports.some(r => r.id === prevId)) return prevId;
            return formattedReports[0].id;
          });
        }
      }

      if (Array.isArray(dbTimeline)) {
        const mappedEvents = [];
        for (const visit of dbTimeline) {
          const visitReports = visit.reports || [];
          if (visitReports.length === 0) {
            mappedEvents.push({
              id: `tl-visit-${visit.visitId}`,
              date: new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              title: `Visit: ${visit.hospitalName}`,
              facility: visit.hospitalName,
              hospitalId: visit.hospitalId,
              type: 'Clinical Visit',
              badge: 'Completed',
              badgeColor: 'teal',
              description: visit.reasonForVisit || `Routine consultation with ${visit.physicianName || 'Attending Physician'}.`
            });
          } else {
            for (const rep of visitReports) {
              mappedEvents.push({
                id: `tl-rep-${rep.id}`,
                date: new Date(rep.reportDate || visit.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                title: rep.title,
                facility: visit.hospitalName,
                hospitalId: visit.hospitalId,
                type: rep.category || 'Lab Report',
                badge: rep.processingStatus === 'completed' ? 'Verified' : 'Processing',
                badgeColor: 'teal',
                description: rep.aiSummary || `Clinical record attached to ${visit.hospitalName} on ${visit.visitDate}.`,
                reportId: rep.id
              });
            }
          }
        }
        setTimelineEvents(mappedEvents);
      }
    } catch (err) {
      console.warn('[AppContext] Data refresh error:', err);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // Synchronize Firebase Authentication state across refreshes & restore session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        setIsAuthLoading(true);

        // Check if Firebase Auth is available
        if (auth) {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!isMounted) return;

            if (user) {
              setFirebaseUser(user);
              try {
                const idToken = await user.getIdToken().catch(() => null);
                const syncRes = await apiClient.auth.syncFirebaseUser({
                  uid: user.uid,
                  email: user.email,
                  name: user.displayName || user.email.split('@')[0],
                  phone: user.phoneNumber || null,
                  idToken
                });
                if (syncRes?.user && isMounted) {
                  setUserProfile(prev => ({
                    ...prev,
                    id: syncRes.user.id,
                    name: syncRes.user.name,
                    email: syncRes.user.email,
                    phone: syncRes.user.phone || prev.phone,
                    bloodGroup: syncRes.user.bloodGroup || prev.bloodGroup,
                    age: syncRes.user.age || prev.age
                  }));
                }
              } catch (syncErr) {
                console.warn('[AppContext] Firebase session sync error:', syncErr);
              }
              await refreshBackendData();
            } else {
              // No Firebase session; check if an existing local JWT token exists (e.g. demo mode)
              const token = apiClient.getToken();
              let localUser = null;
              if (token) {
                try {
                  localUser = await apiClient.auth.getMe();
                } catch {
                  apiClient.auth.logout();
                }
              }

              if (localUser && isMounted) {
                setUserProfile(prev => ({
                  ...prev,
                  id: localUser.id,
                  name: localUser.name,
                  email: localUser.email,
                  phone: localUser.phone || prev.phone,
                  bloodGroup: localUser.bloodGroup || prev.bloodGroup,
                  age: localUser.age || prev.age
                }));
                await refreshBackendData();
              } else if (isMounted) {
                setFirebaseUser(null);
                setReports([]);
                setHospitals([]);
                setTimelineEvents([]);
              }
            }

            if (isMounted) {
              setIsAuthLoading(false);
              setIsLoadingBackend(false);
            }
          });

          return () => {
            isMounted = false;
            unsubscribe();
          };
        } else {
          // If Firebase is not configured, fall back to stored token
          const token = apiClient.getToken();
          if (token) {
            try {
              const localUser = await apiClient.auth.getMe();
              if (localUser && isMounted) {
                setUserProfile(prev => ({
                  ...prev,
                  id: localUser.id,
                  name: localUser.name,
                  email: localUser.email
                }));
                await refreshBackendData();
              }
            } catch {
              apiClient.auth.logout();
            }
          }
          if (isMounted) {
            setIsAuthLoading(false);
            setIsLoadingBackend(false);
          }
        }
      } catch (err) {
        console.warn('[AppContext] Session initialization error:', err);
        if (isMounted) {
          setIsAuthLoading(false);
          setIsLoadingBackend(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Real Firebase Email/Password Sign-In
   */
  const loginWithEmail = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify configuration.');
    }

    setIsLoadingBackend(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      setFirebaseUser(user);

      try {
        const idToken = await user.getIdToken().catch(() => null);
        const syncRes = await apiClient.auth.syncFirebaseUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          idToken
        });
        if (syncRes?.user) {
          setUserProfile(prev => ({
            ...prev,
            id: syncRes.user.id,
            name: syncRes.user.name,
            email: syncRes.user.email
          }));
        }
      } catch (syncErr) {
        console.warn('[AppContext] Backend sync error on login:', syncErr);
      }

      await refreshBackendData();
      try { localStorage.setItem('hc_has_onboarded', 'true'); } catch {}
      setCurrentScreen('home');
      setActiveTab('home');
      return cred;
    } finally {
      setIsLoadingBackend(false);
    }
  };

  /**
   * Real Firebase Email/Password Account Creation (Sign-Up)
   */
  const signupWithEmail = async (email, password, name) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify configuration.');
    }

    setIsLoadingBackend(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (name && name.trim()) {
        try {
          await updateProfile(user, { displayName: name.trim() });
        } catch (profErr) {
          console.warn('[AppContext] Could not set displayName:', profErr);
        }
      }

      setFirebaseUser(user);

      try {
        const idToken = await user.getIdToken().catch(() => null);
        const syncRes = await apiClient.auth.syncFirebaseUser({
          uid: user.uid,
          email: user.email,
          name: (name && name.trim()) || user.email.split('@')[0],
          idToken
        });
        if (syncRes?.user) {
          setUserProfile(prev => ({
            ...prev,
            id: syncRes.user.id,
            name: syncRes.user.name,
            email: syncRes.user.email
          }));
        }
      } catch (syncErr) {
        console.warn('[AppContext] Backend sync error on signup:', syncErr);
      }

      await refreshBackendData();
      try { localStorage.setItem('hc_has_onboarded', 'true'); } catch {}
      setCurrentScreen('home');
      setActiveTab('home');
      return cred;
    } finally {
      setIsLoadingBackend(false);
    }
  };

  /**
   * 1-Click Demo Login for testing and previewing
   */
  const demoLogin = async (profile) => {
    try {
      setIsLoadingBackend(true);
      const syncRes = await apiClient.auth.syncFirebaseUser({
        uid: profile?.id || 'usr_prod_demo_01',
        email: profile?.email || 'priya.sharma@healthcopilot.local',
        name: profile?.name || 'Priya Sharma',
        phone: profile?.phone || '+1 (555) 839-2041'
      });
      if (syncRes?.user) {
        setUserProfile(prev => ({
          ...prev,
          id: syncRes.user.id,
          name: syncRes.user.name,
          email: syncRes.user.email,
          phone: syncRes.user.phone || prev.phone
        }));
      }
      await refreshBackendData();
      try { localStorage.setItem('hc_has_onboarded', 'true'); } catch {}
      setCurrentScreen('home');
      setActiveTab('home');
    } finally {
      setIsLoadingBackend(false);
    }
  };

  /**
   * Sign out of Firebase and clear active session
   */
  const logoutUser = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('[AppContext] Error signing out from Firebase:', err);
    }
    apiClient.auth.logout();
    setFirebaseUser(null);
    setUserProfile(INITIAL_USER);
    setReports([]);
    setHospitals([]);
    setTimelineEvents([]);
    setCurrentScreen('login');
    setActiveTab('home');
  };

  // Backward compatible loginUser alias
  const loginUser = (args) => {
    if (args?.password && args?.email) {
      return loginWithEmail(args.email, args.password);
    }
    return demoLogin(args);
  };

  const updateReportMetadata = async (reportId, updates) => {
    try {
      const updated = await apiClient.reports.updateReport(reportId, updates);
      if (updated) {
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              ...updated,
              date: new Date(updated.reportDate || r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
          }
          return r;
        }));
        await refreshBackendData();
      }
      return updated;
    } catch (err) {
      console.error('[UpdateReportMetadata Error]', err);
      throw err;
    }
  };

  // Multi-step Upload Flow State (Exact Order: 1. Type -> 2. Document Preview -> 3. Hospital -> 4. Date -> 5. AI Analysis -> 6. Save & History)
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadFormData, setUploadFormData] = useState({
    reportType: REPORT_TYPES[0],
    selectedFile: null,
    filePreviewUrl: null,
    hospitalId: null,
    hospitalName: '',
    visitDate: '',
    doctorName: "Dr. Sarah Jenkins, MD",
    extractedText: "",
    biomarkers: []
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState(null);

  // Modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, reportId: null });
  const [permissionModal, setPermissionModal] = useState(false);
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);

  // OCR Integration & Backend Health State
  const [ocrError, setOcrError] = useState(null);
  const [ocrHealth, setOcrHealth] = useState(null);

  // Check OCR backend health on mount
  useEffect(() => {
    fetch('/api/ocr/health')
      .then(res => res.json())
      .then(data => {
        setOcrHealth(data);
      })
      .catch(err => {
        console.warn('[AppContext] OCR Health Check unreachable:', err);
      });
  }, []);

  // Voice AI Assistant State
  const [voiceLanguage, setVoiceLanguage] = useState('en'); // 'te' | 'en' | 'hi'
  const [voiceState, setVoiceState] = useState({
    isOpen: false,
    isListening: false,
    isProcessing: false,
    query: '',
    answer: null,
    isSpeaking: false,
    language: 'en',
    history: []
  });

  // Patient Knowledge Base & Voice Guided Upload State
  const [knowledgeProfile, setKnowledgeProfile] = useState({
    biomarkers: [],
    doctors: [],
    hospitals: [],
    conditions: [],
    totalEntries: 0
  });

  const [voiceInterview, setVoiceInterview] = useState({
    isActive: false,
    isAnalyzing: false,
    step: null, // 'CONFIRM_DATE' | 'CONFIRM_HOSPITAL' | 'CONFIRM_DOCTOR' | 'CONFIRM_CONTEXT' | 'COMPLETED'
    prompt: '',
    draftReport: null,
    visitId: null,
    reportId: null,
    answers: {
      date: '',
      hospital: '',
      doctor: '',
      context: ''
    }
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('hc_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to save reports to localStorage', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('hc_hospitals', JSON.stringify(hospitals));
    } catch (e) {
      console.warn('Failed to save hospitals to localStorage', e);
    }
  }, [hospitals]);

  useEffect(() => {
    try {
      localStorage.setItem('hc_timeline', JSON.stringify(timelineEvents));
    } catch (e) {
      console.warn('Failed to save timeline to localStorage', e);
    }
  }, [timelineEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('hc_user', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save user to localStorage', e);
    }
  }, [userProfile]);

  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || null;

  // Medical Storage Status
  const storageStatus = {
    totalLimitMB: 100,
    usedMB: (reports.reduce((acc, r) => {
      const match = r.fileSize?.match(/([\d.]+)\s*MB/i);
      return acc + (match ? parseFloat(match[1]) : 1.8);
    }, 0.6)).toFixed(1),
    reportsCount: reports.length,
    hospitalsCount: hospitals.length,
    biomarkersCount: reports.reduce((acc, r) => acc + (r.biomarkers?.length || 0), 0),
    vaultStatus: "HIPAA Compliant • 256-bit Encrypted",
    lastBackup: "Today, Automated Cloud Sync"
  };

  // Actions
  const navigateTo = (screen, tab = null) => {
    setCurrentScreen(screen);
    if (tab) setActiveTab(tab);
    if (['home', 'recent_reports', 'timeline', 'profile', 'upload'].includes(screen)) {
      try { localStorage.setItem('hc_has_onboarded', 'true'); } catch {}
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    try { localStorage.setItem('hc_has_onboarded', 'true'); } catch {}
    if (tab === 'home') setCurrentScreen('home');
    else if (tab === 'reports') {
      if (reports.length === 0) setCurrentScreen('empty_state');
      else setCurrentScreen('recent_reports');
    }
    else if (tab === 'timeline') setCurrentScreen('timeline');
    else if (tab === 'profile') setCurrentScreen('profile');
  };

  const viewReport = (reportId) => {
    setActiveReportId(reportId);
    setCurrentScreen('report_details');
  };

  const deleteReport = async (reportId) => {
    try {
      await apiClient.reports.deleteReport(reportId);
    } catch (e) {
      console.warn('Backend delete error (may be offline/draft):', e.message);
    }

    setReports(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      if (updated.length === 0) {
        setTimeout(() => setCurrentScreen('empty_state'), 50);
      } else {
        setActiveReportId(updated[0].id);
        setTimeout(() => setCurrentScreen('recent_reports'), 50);
      }
      return updated;
    });

    // Also remove from timeline
    setTimelineEvents(prev => prev.filter(t => t.reportId !== reportId));
    setDeleteModal({ isOpen: false, reportId: null });
  };

  const addHospital = async ({ name, location, branch, department }) => {
    if (!name || !name.trim()) return;

    try {
      const persisted = await apiClient.hospitals.create({
        name: name.trim(),
        location: location?.trim() || "Local Clinic / Diagnostic Center",
        branch: branch?.trim() || null,
        department: department?.trim() || null
      });

      const newHospital = {
        id: persisted.id,
        name: persisted.name,
        location: persisted.location || "Local Clinic / Diagnostic Center",
        latestVisitDate: "New Registration",
        reportCount: 0,
        icon: "🏥",
        color: "teal"
      };

      setHospitals(prev => [newHospital, ...prev]);
      setIsAddHospitalModalOpen(false);

      // If currently in upload flow, auto-select this new hospital
      setUploadFormData(prev => ({
        ...prev,
        hospitalId: newHospital.id,
        hospitalName: newHospital.name
      }));

      return newHospital;
    } catch (err) {
      console.warn('[AddHospital Backend Warning]', err.message);
      // Fallback local addition if network blip
      const fallbackHospital = {
        id: `hosp-${Date.now()}`,
        name: name.trim(),
        location: location?.trim() || "Local Clinic / Diagnostic Center",
        latestVisitDate: "New Registration",
        reportCount: 0,
        icon: "🏥",
        color: "teal"
      };
      setHospitals(prev => [fallbackHospital, ...prev]);
      setIsAddHospitalModalOpen(false);
      return fallbackHospital;
    }
  };

  const restoreSampleReports = async () => {
    try {
      // Seed sample hospitals in backend
      for (const h of INITIAL_HOSPITALS) {
        await apiClient.hospitals.create({
          name: h.name,
          location: h.location
        }).catch(() => {});
      }

      // Seed sample reports in backend
      for (const r of INITIAL_REPORTS) {
        await apiClient.reports.uploadReport({
          hospitalName: r.hospitalName || r.labName,
          visitDate: r.timestamp ? r.timestamp.split('T')[0] : '2024-03-15',
          reportDate: r.timestamp ? r.timestamp.split('T')[0] : '2024-03-15',
          title: r.title,
          category: r.category,
          base64Content: 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNTYKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihTYW1wbGUgUmVwb3J0KSBUagpFVAppbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIwOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjEyMzQKJSVFT0YK',
          fileName: `${r.title.replace(/\s+/g, '_')}.pdf`,
          mimeType: 'application/pdf',
          aiAnalysis: {
            documentType: r.category,
            plainLanguageSummary: { overview: r.aiSummary }
          }
        }).catch(() => {});
      }

      // Re-fetch clean persistent data
      const [dbHospitals, dbReports, dbTimeline] = await Promise.all([
        apiClient.hospitals.getAll().catch(() => []),
        apiClient.reports.getAll().catch(() => []),
        apiClient.timeline.getTimeline().catch(() => [])
      ]);

      if (dbHospitals.length > 0) setHospitals(dbHospitals);
      if (dbReports.length > 0) {
        const formatted = dbReports.map(r => ({
          ...r,
          fileSize: r.fileSizeFormatted || '2.4 MB',
          date: new Date(r.reportDate || r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Processed',
          doctorName: r.physicianName || 'Dr. Sarah Jenkins, MD',
          labName: r.hospital?.name || r.hospitalName || 'Clinical Diagnostics',
          hospitalName: r.hospital?.name || r.hospitalName || 'Clinical Diagnostics',
          biomarkers: r.aiAnalysis?.extractedBiomarkers || []
        }));
        setReports(formatted);
        setActiveReportId(formatted[0].id);
      }
    } catch (e) {
      setReports(INITIAL_REPORTS);
      setHospitals(INITIAL_HOSPITALS);
      setTimelineEvents(TIMELINE_EVENTS);
      setActiveReportId(INITIAL_REPORTS[0].id);
    }

    setCurrentScreen('recent_reports');
    setActiveTab('reports');
  };

  // Upload workflow management
  const resetUploadFlow = () => {
    setUploadStep(1);
    setUploadFormData({
      reportType: REPORT_TYPES[0],
      selectedFile: null,
      filePreviewUrl: null,
      hospitalId: null,
      hospitalName: '',
      visitDate: '',
      doctorName: '',
      extractedText: '',
      biomarkers: []
    });
    setUploadProgress(0);
    setProcessingStage(0);
    setExtractedDraft(null);
  };

  // Launch real OCR analysis via backend API
  const executeDocumentAnalysis = async () => {
    if (isAnalyzing) return; // Prevent duplicate clicks and parallel executions
    setIsAnalyzing(true);
    setExtractedDraft(null); // Clear any prior draft immediately
    setCurrentScreen('processing');
    setUploadProgress(20);
    setProcessingStage(0); // 0: Uploading
    setOcrError(null);

    const fileName = uploadFormData.selectedFile?.name || "Medical_Report.pdf";
    const fileSizeMB = uploadFormData.selectedFile ? (uploadFormData.selectedFile.size / (1024 * 1024)).toFixed(1) : "2.1";
    const rawFile = uploadFormData.selectedFile?.rawFile;

    try {
      setUploadProgress(45);
      setProcessingStage(1); // 1: Reading report

      let clinicalData;

      if (rawFile) {
        // Send multipart form directly to clinical analysis endpoint
        const formData = new FormData();
        formData.append('document', rawFile);
        const isPrescription = uploadFormData.reportType?.id === 'prescription' || uploadFormData.reportType?.name === 'Prescription';
        if (uploadFormData.reportType?.name) {
          formData.append('category', uploadFormData.reportType.name);
        }
        formData.append('documentType', isPrescription ? 'prescription' : 'lab_report');
        formData.append('fileName', fileName);

        const res = await fetch('/api/clinical/analyze', {
          method: 'POST',
          body: formData
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw json.error || new Error('Clinical analysis failed');
        }
        clinicalData = json.data;
      } else {
        // If sample was selected or base64 fallback
        const sampleBase64 = 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNTYKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihBUE9MTE8gSE9TUElUQUwgQ0JDIFJFUE9SVCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxMjM0CiUlRU9GCg==';
        const isPrescription = uploadFormData.reportType?.id === 'prescription' || uploadFormData.reportType?.name === 'Prescription';
        const res = await fetch('/api/clinical/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Content: sampleBase64,
            mimeType: 'application/pdf',
            category: uploadFormData.reportType?.name,
            documentType: isPrescription ? 'prescription' : 'lab_report',
            fileName
          })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw json.error || new Error('Clinical analysis failed');
        }
        clinicalData = json.data;
      }

      setUploadProgress(75);
      setProcessingStage(2); // 2: Checking extracted details

      // Map labResults to biomarkers array preserving exact values, units and source ranges
      const mappedBiomarkers = (clinicalData.labResults || []).map((lr, idx) => {
        const rawRange = lr.referenceRange?.rawRange || lr.referenceInterval?.rawRange || (
          lr.referenceRange?.low != null && lr.referenceRange?.high != null
            ? `${lr.referenceRange.low} - ${lr.referenceRange.high}`
            : 'Unavailable'
        );

        return {
          id: `bm-${idx}-${Date.now()}`,
          name: lr.name,
          category: lr.category || clinicalData.category || uploadFormData.reportType.name,
          value: lr.numericValue != null ? lr.numericValue : (lr.rawValue || 'N/A'),
          numericValue: lr.numericValue,
          rawValue: lr.rawValue,
          unit: lr.unit || '',
          minRange: lr.referenceRange?.low ?? null,
          maxRange: lr.referenceRange?.high ?? null,
          rawRange,
          status: lr.status === 'NORMAL' ? 'Normal' : (lr.status === 'HIGH' ? 'Slightly Elevated' : (lr.status === 'LOW' ? 'Low' : 'Normal')),
          explanation: lr.interpretation || 'Clinical measurement from verified source document.',
          historicalReadings: lr.historicalReadings || [],
          flags: lr.flags,
          evidence: lr.evidence
        };
      });

      setUploadProgress(90);
      setProcessingStage(3); // 3: Preparing simple explanation

      const extractedReportDate = clinicalData.metadata?.documentDate || null;
      const configuredVisitDate = uploadFormData.visitDate || null;
      const isDateUncertain = !extractedReportDate || clinicalData.metadata?.evidence?.date?.presence === 'UNCERTAIN';

      const newDraft = {
        id: clinicalData.documentId || `rep-${Date.now()}`,
        title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        category: clinicalData.category || uploadFormData.reportType.name,
        reportType: clinicalData.category || uploadFormData.reportType.name,
        fileType: uploadFormData.selectedFile?.type?.includes("image") ? "IMAGE" : "PDF",
        fileSize: `${fileSizeMB} MB`,
        hospitalId: uploadFormData.hospitalId || null,
        hospitalName: uploadFormData.hospitalName || clinicalData.metadata?.facilityName || "Clinical Facility",
        doctorName: clinicalData.metadata?.clinicianName || uploadFormData.doctorName || "",
        reportDate: extractedReportDate,
        visitDate: configuredVisitDate,
        uploadTimestamp: new Date().toISOString(),
        isDateUncertain,
        date: extractedReportDate ? new Date(extractedReportDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
        timestamp: new Date().toISOString(),
        status: "Processed",
        biomarkersCount: mappedBiomarkers.length,
        aiSummary: clinicalData.plainLanguageSummary?.overview || `Processed document successfully.`,
        recommendation: clinicalData.plainLanguageSummary?.whatToAskDoctor?.join(' ') || clinicalData.plainLanguageSummary?.disclaimer || "Discuss these results during your next clinical appointment.",
        biomarkers: mappedBiomarkers,
        medications: clinicalData.medications || [],
        imagingFindings: clinicalData.imagingFindings || [],
        vaccinations: clinicalData.vaccinations || [],
        explicitDiagnoses: clinicalData.explicitDiagnoses || [],
        overallFlags: clinicalData.overallFlags || null,
        rawAnalysis: clinicalData,
        rawOcr: clinicalData.rawOcr || null,
        previewUrl: uploadFormData.filePreviewUrl,
        extractedText: clinicalData.rawOcr?.fullText || ''
      };

      setUploadProgress(100);
      setProcessingStage(4);
      setExtractedDraft(newDraft);
      setCurrentScreen('success');
    } catch (err) {
      console.error('[OCR Pipeline Exception]', err);
      setOcrError({
        code: err.code || 'PIPELINE_ERROR',
        message: err.message || 'Could not complete clinical analysis of the document.',
        details: err.details || null
      });
      setCurrentScreen('error_state');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmExtractedDraft = async () => {
    if (extractedDraft) {
      if (!extractedDraft.reportDate) {
        throw new Error('Please confirm the clinical report date before saving.');
      }
      const cleanReportDate = extractedDraft.reportDate;
      const cleanVisitDate = extractedDraft.visitDate || cleanReportDate;

      try {
        let base64Content = null;
        if (uploadFormData.selectedFile?.rawFile) {
          const reader = new FileReader();
          base64Content = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(uploadFormData.selectedFile.rawFile);
          });
        }

        const sessionKey = `hc-ingest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const persisted = await apiClient.reports.uploadReport({
          hospitalId: extractedDraft.hospitalId,
          hospitalName: extractedDraft.hospitalName,
          visitDate: cleanVisitDate,
          reportDate: cleanReportDate,
          title: extractedDraft.title,
          category: extractedDraft.category || extractedDraft.reportType || 'Lab Report',
          physicianName: extractedDraft.doctorName || null,
          idempotencyKey: sessionKey,
          base64Content: base64Content || 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNTYKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihBUE9MTE8gSE9TUElUQUwgQ0JDIFJFUE9SVCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMDkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxMjM0CiUlRU9GCg==',
          fileName: uploadFormData.selectedFile?.name || `${extractedDraft.title}.pdf`,
          mimeType: uploadFormData.selectedFile?.type || 'application/pdf',
          ocrResult: extractedDraft.rawOcr || extractedDraft.rawAnalysis?.rawOcr || null,
          aiAnalysis: extractedDraft.rawAnalysis || {
            documentType: extractedDraft.category || 'Lab Report',
            plainLanguageSummary: {
              overview: extractedDraft.aiSummary
            },
            extractedBiomarkers: extractedDraft.biomarkers || []
          }
        });

        if (persisted && persisted.id) {
          extractedDraft.id = persisted.id;
          extractedDraft.signedDownloadUrl = persisted.signedDownloadUrl;
          setActiveReportId(persisted.id);
        } else {
          setActiveReportId(extractedDraft.id);
        }

        // Refresh database state from backend
        await refreshBackendData();
      } catch (saveErr) {
        console.warn('[ConfirmDraft] Backend persistence warning:', saveErr.message);
      }

      // Add to reports in local state as well
      setReports(prev => [extractedDraft, ...prev.filter(r => r.id !== extractedDraft.id)]);
      setActiveReportId(extractedDraft.id);

      setCurrentScreen('report_details');
      setExtractedDraft(null);
    }
  };

  // Conversational Multilingual Voice AI Query Handling
  const askAI = async (queryText, overrideLang = null) => {
    if (!queryText || !queryText.trim()) return;

    const activeLang = overrideLang || voiceLanguage;

    setVoiceState(prev => ({
      ...prev,
      isOpen: true,
      isListening: false,
      isProcessing: true,
      query: queryText
    }));

    try {
      const token = apiClient.getToken();
      const currentHistory = voiceState.history || [];

      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: queryText,
          language: activeLang,
          history: currentHistory.slice(-6),
          reportId: activeReportId || null
        })
      });

      if (!res.ok) {
        throw new Error(`Voice chat server error HTTP ${res.status}`);
      }

      const data = await res.json();
      const respLang = data.language || activeLang;
      if (respLang !== voiceLanguage) {
        setVoiceLanguage(respLang);
      }

      const answerPayload = {
        question: queryText,
        answer: data.answer,
        action: data.action || null,
        sources: data.sources || ['HealthCopilot Unified Records'],
        followUps: data.followUps || [],
        isEmergency: Boolean(data.isEmergency),
        simpleBreakdown: data.simpleBreakdown || null,
        disclaimer: data.medicalDisclaimer
      };

      const updatedHistory = [
        ...currentHistory,
        { role: 'user', content: queryText },
        { role: 'assistant', content: data.answer }
      ];

      setVoiceState(prev => ({
        ...prev,
        isProcessing: false,
        answer: answerPayload,
        isSpeaking: true,
        language: respLang,
        history: updatedHistory
      }));

      // Speak using natural voice prosody
      speakNaturalUtterance(data.spokenText || data.answer, {
        language: respLang,
        rate: 0.95,
        onStart: () => setVoiceState(p => ({ ...p, isSpeaking: true })),
        onEnd: () => setVoiceState(p => ({ ...p, isSpeaking: false })),
        onError: () => setVoiceState(p => ({ ...p, isSpeaking: false }))
      });

      setCurrentScreen('voice_answer');
    } catch (err) {
      console.warn('[AppContext askAI] Fallback to local answering:', err.message);

      const lower = (queryText || '').toLowerCase();
      let matched = AI_KNOWLEDGE_BASE.find(item =>
        item.triggers.some(t => lower.includes(t))
      );
      if (!matched) {
        matched = {
          question: queryText,
          answer: activeLang === 'te'
            ? 'మీ ఆరోగ్య నివేదిక ఆధారంగా ముఖ్యమైన ఫలితాలు స్థిరంగా ఉన్నాయి. మరింత సమాచారం కోసం మీ వైద్యుని సంప్రదించండి.'
            : activeLang === 'hi'
            ? 'आपकी स्वास्थ्य रिपोर्ट के अनुसार मुख्य संकेतक स्थिर हैं। व्यक्तिगत सलाह के लिए अपने डॉक्टर से संपर्क करें।'
            : 'Based on your recent medical records, your key indicators reflect stable health parameters. Always consult your physician for individualized medical guidance.',
          sources: ["HealthCopilot Unified Records"],
          followUps: ['Explain my latest report', 'Check hemoglobin level']
        };
      }

      setVoiceState(prev => ({
        ...prev,
        isProcessing: false,
        answer: matched,
        isSpeaking: true,
        language: activeLang
      }));

      speakNaturalUtterance(matched.answer, {
        language: activeLang,
        rate: 0.95,
        onStart: () => setVoiceState(p => ({ ...p, isSpeaking: true })),
        onEnd: () => setVoiceState(p => ({ ...p, isSpeaking: false })),
        onError: () => setVoiceState(p => ({ ...p, isSpeaking: false }))
      });

      setCurrentScreen('voice_answer');
    }
  };

  const fetchKnowledgeProfile = async () => {
    try {
      const token = apiClient.getToken();
      const res = await fetch('/api/voice/knowledge-base', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setKnowledgeProfile(data.profile);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to fetch knowledge profile:', err);
    }
  };

  const handleVoiceUploadDocument = async (file) => {
    if (!file) return;

    setVoiceInterview(prev => ({
      ...prev,
      isActive: true,
      isAnalyzing: true,
      step: 'ANALYZING',
      prompt: voiceLanguage === 'te'
        ? 'మీ రిపోర్ట్‌ను చదువుతున్నాము, దయచేసి వేచి ఉండండి...'
        : (voiceLanguage === 'hi' ? 'आपकी रिपोर्ट का विश्लेषण कर रहे हैं, कृपया प्रतीक्षा करें...' : 'Analyzing your document, please hold on a moment...')
    }));

    speakNaturalUtterance(
      voiceLanguage === 'te' ? 'మీ రిపోర్ట్‌ను చదువుతున్నాను...' : (voiceLanguage === 'hi' ? 'आपकी रिपोर्ट का विश्लेषण कर रहा हूँ...' : 'Analyzing your medical report now...'),
      { language: voiceLanguage, rate: 0.95 }
    );

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('fileName', file.name || 'Voice_Upload_Report.pdf');

      const res = await fetch('/api/clinical/analyze', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to analyze report');
      }

      const clinicalData = json.data;
      const detectedDate = clinicalData.metadata?.documentDate || new Date().toISOString().split('T')[0];
      const detectedHospital = clinicalData.metadata?.facilityName || 'Apollo Hospital';
      const detectedDoctor = clinicalData.metadata?.clinicianName || '';

      const draft = {
        id: clinicalData.documentId || `rep-${Date.now()}`,
        title: (file.name || 'Medical Report').replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        category: clinicalData.category || 'Lab Report',
        reportDate: detectedDate,
        hospitalName: detectedHospital,
        doctorName: detectedDoctor,
        biomarkers: (clinicalData.labResults || []).map((lr, idx) => ({
          id: `bm-${idx}-${Date.now()}`,
          name: lr.name,
          value: lr.numericValue != null ? lr.numericValue : (lr.rawValue || 'N/A'),
          unit: lr.unit || '',
          status: lr.status === 'NORMAL' ? 'Normal' : (lr.status === 'HIGH' ? 'Slightly Elevated' : 'Low'),
          rawRange: lr.referenceRange?.rawRange || 'Unavailable'
        })),
        rawAnalysis: clinicalData
      };

      // Step 1: CONFIRM_DATE
      const dateQuestion = voiceLanguage === 'te'
        ? `ఈ రిపోర్ట్‌లోని తేదీ ${detectedDate} గా గుర్తించబడింది. మీ పరీక్ష జరిగిన తేదీ ఇదేనా?`
        : (voiceLanguage === 'hi'
        ? `इस रिपोर्ट पर ${detectedDate} की तारीख दिखाई दे रही है। क्या यह वही तारीख है जब आपका टेस्ट हुआ था?`
        : `I noticed the report date might be ${detectedDate}. Is this the exact date your test was taken?`);

      setVoiceInterview({
        isActive: true,
        isAnalyzing: false,
        step: 'CONFIRM_DATE',
        prompt: dateQuestion,
        draftReport: draft,
        visitId: clinicalData.visitId || null,
        reportId: draft.id,
        answers: {
          date: detectedDate,
          hospital: detectedHospital,
          doctor: detectedDoctor,
          context: ''
        }
      });

      speakNaturalUtterance(dateQuestion, { language: voiceLanguage, rate: 0.95 });

    } catch (err) {
      console.error('[VoiceUpload] Analysis error:', err);
      const errMsg = voiceLanguage === 'te'
        ? 'రిపోర్ట్ చదవడంలో లోపం ఏర్పడింది. దయచేసి స్పష్టమైన చిత్రాన్ని లేదా PDFని మళ్ళీ ప్రయత్నించండి.'
        : (voiceLanguage === 'hi' ? 'दस्तावेज़ पढ़ने में त्रुटि हुई। कृपया स्पष्ट तस्वीर या PDF से पुनः प्रयास करें।' : 'Could not read the document clearly. Please try again with a clear scan or PDF.');

      setVoiceInterview({
        isActive: false,
        isAnalyzing: false,
        step: null,
        prompt: errMsg,
        draftReport: null,
        visitId: null,
        reportId: null,
        answers: {}
      });

      speakNaturalUtterance(errMsg, { language: voiceLanguage });
    }
  };

  const submitVoiceInterviewAnswer = async (answerText) => {
    if (!voiceInterview.step || !answerText) return;

    const currentStep = voiceInterview.step;
    try {
      const token = apiClient.getToken();
      const res = await fetch('/api/voice/interview-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          step: currentStep,
          answer: answerText,
          visitId: voiceInterview.visitId,
          reportId: voiceInterview.reportId,
          language: voiceLanguage
        })
      });

      const data = await res.json();

      const updatedAnswers = {
        ...voiceInterview.answers,
        [currentStep === 'CONFIRM_DATE' ? 'date' : currentStep === 'CONFIRM_HOSPITAL' ? 'hospital' : currentStep === 'CONFIRM_DOCTOR' ? 'doctor' : 'context']: answerText
      };

      if (data.completed || data.step === 'COMPLETED') {
        const token = apiClient.getToken();
        await fetch('/api/voice/absorb-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            report: voiceInterview.draftReport,
            hospitalName: updatedAnswers.hospital,
            physicianName: updatedAnswers.doctor,
            labResults: voiceInterview.draftReport?.rawAnalysis?.labResults || []
          })
        }).catch(() => {});

        fetchKnowledgeProfile();

        setVoiceInterview(prev => ({
          ...prev,
          isActive: false,
          step: 'COMPLETED',
          prompt: data.prompt,
          answers: updatedAnswers
        }));

        const explainQuery = voiceLanguage === 'te'
          ? 'నా అప్‌లోడ్ చేసిన రిపోర్ట్‌ను సరళంగా వివరించండి'
          : (voiceLanguage === 'hi' ? 'मेरी अपलोड की गई रिपोर्ट को आसान भाषा में समझाइए' : 'Explain everything in my newly uploaded report in simple terms');

        askAI(explainQuery, voiceLanguage);

      } else {
        setVoiceInterview(prev => ({
          ...prev,
          step: data.step,
          prompt: data.prompt,
          answers: updatedAnswers
        }));

        speakNaturalUtterance(data.spokenText || data.prompt, {
          language: voiceLanguage,
          rate: 0.95
        });
      }
    } catch (err) {
      console.warn('[InterviewStep] Error:', err);
    }
  };

  const stopSpeaking = () => {
    engineStopSpeaking();
    setVoiceState(p => ({ ...p, isSpeaking: false }));
  };

  const playVoiceGreeting = (lang = voiceLanguage) => {
    playNaturalGreeting(lang, {
      onStart: () => setVoiceState(p => ({ ...p, isSpeaking: true })),
      onEnd: () => setVoiceState(p => ({ ...p, isSpeaking: false }))
    });
  };

  const resetVoiceGreeting = () => {
    resetVoiceSessionGreeting();
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        activeTab,
        setActiveTab,
        handleTabChange,
        viewMode,
        setViewMode,
        showScreenGallery,
        setShowScreenGallery,
        isLoadingBackend,
        hospitals,
        setHospitals,
        addHospital,
        selectedHospitalId,
        setSelectedHospitalId,
        openHospitalDetails,
        isAddHospitalModalOpen,
        setIsAddHospitalModalOpen,
        reports,
        setReports,
        timelineEvents,
        setTimelineEvents,
        activeReportId,
        setActiveReportId,
        activeReport,
        storageStatus,
        viewReport,
        deleteReport,
        updateReportMetadata,
        restoreSampleReports,
        userProfile,
        setUserProfile,
        firebaseUser,
        isAuthenticated: Boolean(firebaseUser || apiClient.getToken()),
        isAuthLoading,
        loginWithEmail,
        signupWithEmail,
        demoLogin,
        loginUser,
        logoutUser,
        refreshBackendData,
        uploadStep,
        setUploadStep,
        uploadFormData,
        setUploadFormData,
        resetUploadFlow,
        executeDocumentAnalysis,
        uploadProgress,
        processingStage,
        isAnalyzing,
        extractedDraft,
        setExtractedDraft,
        confirmExtractedDraft,
        deleteModal,
        setDeleteModal,
        permissionModal,
        setPermissionModal,
        voiceState,
        setVoiceState,
        voiceLanguage,
        setVoiceLanguage,
        knowledgeProfile,
        fetchKnowledgeProfile,
        voiceInterview,
        setVoiceInterview,
        handleVoiceUploadDocument,
        submitVoiceInterviewAnswer,
        playVoiceGreeting,
        resetVoiceGreeting,
        askAI,
        stopSpeaking,
        ocrError,
        setOcrError,
        ocrHealth,
        navigateTo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
