export const INITIAL_USER = {
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  phone: "+1 (555) 839-2041",
  age: 32,
  gender: "Female",
  bloodGroup: "AB+",
  emergencyContact: {
    name: "Rahul Sharma",
    relation: "Spouse",
    phone: "+1 (555) 234-5678"
  },
  privacySettings: {
    e2eEncryption: true,
    hipaaConsent: true,
    aiTrainingOptOut: true,
    biometricLock: false,
    notifications: true
  }
};

export const REPORT_TYPES = [
  {
    id: "lab",
    name: "Lab Report",
    desc: "Blood test, pathology, urine panel",
    icon: "🧪",
    color: "teal",
    gradient: "from-teal-500 to-emerald-500"
  },
  {
    id: "discharge",
    name: "Discharge Summary/Letter",
    desc: "Hospital admission, discharge & inpatient notes",
    icon: "🏥",
    color: "sky",
    gradient: "from-sky-500 to-blue-600"
  },
  {
    id: "prescription",
    name: "Prescription",
    desc: "Medications, dosages & instructions",
    icon: "💊",
    color: "amber",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    id: "scan",
    name: "Scan/Imaging Report",
    desc: "X-Ray, MRI, CT Scan, Ultrasound",
    icon: "🩻",
    color: "purple",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    id: "consultation",
    name: "Doctor Consultation/Clinical Notes",
    desc: "Physician consultation, assessment & plan",
    icon: "🩺",
    color: "rose",
    gradient: "from-rose-500 to-pink-600"
  },
  {
    id: "vaccine",
    name: "Vaccination Record",
    desc: "Immunization history & booster certificates",
    icon: "💉",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: "medical_cert",
    name: "Medical Certificate",
    desc: "Sick leave, fitness or health certificate",
    icon: "📜",
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600"
  },
  {
    id: "other",
    name: "Other",
    desc: "Bills, insurance claims or other records",
    icon: "📁",
    color: "slate",
    gradient: "from-slate-500 to-slate-700"
  }
];

export const INITIAL_HOSPITALS = [
  {
    id: "hosp-1",
    name: "Apollo Multispeciality Hospital",
    location: "Jubilee Hills, Hyderabad",
    latestVisitDate: "Apr 26, 2025",
    reportCount: 3,
    icon: "🏥",
    color: "teal"
  },
  {
    id: "hosp-2",
    name: "Metropolis Diagnostics & Healthcare",
    location: "Banjara Hills, Hyderabad",
    latestVisitDate: "Feb 14, 2025",
    reportCount: 2,
    icon: "🔬",
    color: "sky"
  }
];

export const INITIAL_REPORTS = [
  {
    id: "rep-001",
    title: "Complete Blood Count (CBC)",
    category: "Hematology",
    reportType: "Lab Report",
    fileType: "PDF",
    fileSize: "2.4 MB",
    hospitalId: "hosp-1",
    hospitalName: "Apollo Multispeciality Hospital",
    doctorName: "Dr. Sarah Jenkins, MD",
    date: "Apr 26, 2025",
    timestamp: "2025-04-26T09:30:00Z",
    status: "Processed",
    biomarkersCount: 14,
    aiSummary: "Your Complete Blood Count demonstrates healthy red blood cell indices. Hemoglobin has stabilized at 13.2 g/dL. WBC is slightly elevated at 11.2 K/μL, which is consistent with recent minor immune activation or seasonal allergies. Platelet count and differential are normal.",
    recommendation: "Maintain routine hydration. Re-check complete blood count in 3 to 6 months during your routine physical.",
    biomarkers: [
      {
        id: "bm-1",
        name: "Hemoglobin",
        category: "Complete Blood Count",
        value: 13.2,
        unit: "g/dL",
        minRange: 12.0,
        maxRange: 16.0,
        status: "Normal",
        explanation: "Carries oxygen from lungs to rest of your body. Normal levels ensure healthy stamina and energy."
      },
      {
        id: "bm-2",
        name: "WBC Count",
        category: "Complete Blood Count",
        value: 11.2,
        unit: "K/μL",
        minRange: 4.0,
        maxRange: 10.5,
        status: "Slightly Elevated",
        explanation: "White blood cells defend against infections. Mild elevations often reflect seasonal allergies, stress, or minor localized inflammation."
      },
      {
        id: "bm-3",
        name: "Platelets",
        category: "Complete Blood Count",
        value: 240,
        unit: "K/μL",
        minRange: 150,
        maxRange: 450,
        status: "Normal",
        explanation: "Essential for healthy blood clotting and vessel repair."
      },
      {
        id: "bm-4",
        name: "RBC Count",
        category: "Complete Blood Count",
        value: 4.5,
        unit: "M/μL",
        minRange: 4.0,
        maxRange: 5.2,
        status: "Normal",
        explanation: "Total red blood cells circulating throughout your bloodstream."
      },
      {
        id: "bm-5",
        name: "Fasting Blood Sugar",
        category: "Metabolic",
        value: 94,
        unit: "mg/dL",
        minRange: 70,
        maxRange: 99,
        status: "Normal",
        explanation: "Primary blood sugar level after an overnight fast. Indicates optimal insulin sensitivity."
      },
      {
        id: "bm-6",
        name: "HbA1c",
        category: "Metabolic",
        value: 5.4,
        unit: "%",
        minRange: 4.0,
        maxRange: 5.6,
        status: "Normal",
        explanation: "3-month average of blood sugar levels. Below 5.7% is considered non-diabetic and healthy."
      }
    ]
  },
  {
    id: "rep-002",
    title: "Comprehensive Lipid Profile",
    category: "Cardiology",
    reportType: "Lab Report",
    fileType: "PDF",
    fileSize: "1.8 MB",
    hospitalId: "hosp-2",
    hospitalName: "Metropolis Diagnostics & Healthcare",
    doctorName: "Dr. Kevin Patel, MD",
    date: "Feb 14, 2025",
    timestamp: "2025-02-14T11:15:00Z",
    status: "Processed",
    biomarkersCount: 8,
    aiSummary: "Lipid levels show marked improvement compared to previous testing. Total Cholesterol is down to 198 mg/dL from 208 mg/dL. HDL (protective cholesterol) remains strong at 56 mg/dL. Triglycerides are well managed.",
    recommendation: "Continue heart-healthy Mediterranean dietary habits and 150 minutes of weekly aerobic exercise.",
    biomarkers: [
      {
        id: "bm-7",
        name: "Total Cholesterol",
        category: "Lipid Panel",
        value: 198,
        unit: "mg/dL",
        minRange: 125,
        maxRange: 200,
        status: "Normal",
        explanation: "Overall amount of cholesterol in blood. Target is below 200 mg/dL."
      },
      {
        id: "bm-8",
        name: "HDL Cholesterol",
        category: "Lipid Panel",
        value: 56,
        unit: "mg/dL",
        minRange: 50,
        maxRange: 90,
        status: "Normal",
        explanation: "The 'good' cholesterol that helps remove other forms of cholesterol from bloodstream."
      },
      {
        id: "bm-9",
        name: "LDL Cholesterol",
        category: "Lipid Panel",
        value: 118,
        unit: "mg/dL",
        minRange: 50,
        maxRange: 100,
        status: "Slightly Elevated",
        explanation: "The 'bad' cholesterol. Aiming for < 100 mg/dL through aerobic exercise and soluble fiber intake."
      },
      {
        id: "bm-10",
        name: "Triglycerides",
        category: "Lipid Panel",
        value: 120,
        unit: "mg/dL",
        minRange: 0,
        maxRange: 150,
        status: "Normal",
        explanation: "Fat found in your blood. Levels under 150 mg/dL protect cardiovascular health."
      }
    ]
  },
  {
    id: "rep-003",
    title: "Thyroid & Metabolic Health Panel",
    category: "Endocrinology",
    reportType: "Lab Report",
    fileType: "PDF",
    fileSize: "3.1 MB",
    hospitalId: "hosp-1",
    hospitalName: "Apollo Multispeciality Hospital",
    doctorName: "Dr. Anita Desai, MD",
    date: "Dec 12, 2024",
    timestamp: "2024-12-12T08:45:00Z",
    status: "Processed",
    biomarkersCount: 10,
    aiSummary: "Thyroid hormone output (TSH 2.1 mIU/L) is completely balanced. Vitamin D3 is borderline insufficient at 28 ng/mL, for which daily supplementation was initiated.",
    recommendation: "Take 2,000 IU daily Vitamin D3 with meals containing healthy fats. Retest in 6 months.",
    biomarkers: [
      {
        id: "bm-11",
        name: "TSH (Thyroid Stimulating)",
        category: "Endocrine",
        value: 2.1,
        unit: "mIU/L",
        minRange: 0.4,
        maxRange: 4.0,
        status: "Normal",
        explanation: "Regulates energy production, body temperature, and metabolism."
      },
      {
        id: "bm-12",
        name: "Vitamin D3 (25-OH)",
        category: "Vitamins",
        value: 28,
        unit: "ng/mL",
        minRange: 30,
        maxRange: 100,
        status: "Slightly Low",
        explanation: "Crucial for bone mineral density, immune defense, and emotional wellbeing."
      },
      {
        id: "bm-13",
        name: "Vitamin B12",
        category: "Vitamins",
        value: 460,
        unit: "pg/mL",
        minRange: 200,
        maxRange: 900,
        status: "Normal",
        explanation: "Supports neurological function and red blood cell formation."
      }
    ]
  }
];

export const TIMELINE_EVENTS = [
  {
    id: "tl-1",
    date: "Apr 26, 2025",
    title: "Complete Blood Count (CBC)",
    facility: "Apollo Multispeciality Hospital",
    hospitalId: "hosp-1",
    type: "Lab Report",
    badge: "14 Biomarkers",
    badgeColor: "teal",
    description: "Hemoglobin steady at 13.2 g/dL. Mild WBC elevation (11.2 K/μL).",
    reportId: "rep-001"
  },
  {
    id: "tl-2",
    date: "Mar 15, 2025",
    title: "Physician Consultation",
    facility: "Apollo Multispeciality Hospital • Dr. Sarah Jenkins",
    hospitalId: "hosp-1",
    type: "Clinical Visit",
    badge: "Routine Checkup",
    badgeColor: "sky",
    description: "Reviewed cardiovascular progress and confirmed overall vitality improvement.",
    reportId: null
  },
  {
    id: "tl-3",
    date: "Feb 14, 2025",
    title: "Comprehensive Lipid Profile",
    facility: "Metropolis Diagnostics & Healthcare",
    hospitalId: "hosp-2",
    type: "Lab Report",
    badge: "8 Biomarkers",
    badgeColor: "teal",
    description: "Total Cholesterol normalized to 198 mg/dL. HDL robust at 56 mg/dL.",
    reportId: "rep-002"
  },
  {
    id: "tl-4",
    date: "Jan 10, 2025",
    title: "Vitamin D3 Protocol Started",
    facility: "Home Prescription",
    hospitalId: "hosp-1",
    type: "Prescription",
    badge: "Supplement",
    badgeColor: "amber",
    description: "Began 2,000 IU/day Vitamin D3 cholecalciferol regimen for mild deficiency.",
    reportId: null
  },
  {
    id: "tl-5",
    date: "Dec 12, 2024",
    title: "Thyroid & Metabolic Health Panel",
    facility: "Apollo Multispeciality Hospital",
    hospitalId: "hosp-1",
    type: "Lab Report",
    badge: "10 Biomarkers",
    badgeColor: "teal",
    description: "Baseline thyroid evaluation normal (TSH 2.1). Vitamin D identified at 28 ng/mL.",
    reportId: "rep-003"
  }
];

export const TREND_METRICS = {
  hemoglobin: {
    name: "Hemoglobin",
    unit: "g/dL",
    normalMin: 12.0,
    normalMax: 16.0,
    history: [
      { date: "Dec '24", value: 12.8, status: "Normal" },
      { date: "Feb '25", value: 13.1, status: "Normal" },
      { date: "Apr '25", value: 13.2, status: "Normal" }
    ],
    aiInsight: "Hemoglobin has stabilized at healthy levels over the last 6 months (Dec 2024 – Apr 2025), reflecting consistent oxygen transport."
  },
  wbc: {
    name: "WBC Count",
    unit: "K/μL",
    normalMin: 4.0,
    normalMax: 10.5,
    history: [
      { date: "Dec '24", value: 9.8, status: "Normal" },
      { date: "Feb '25", value: 10.9, status: "Slightly Elevated" },
      { date: "Apr '25", value: 11.2, status: "Slightly Elevated" }
    ],
    aiInsight: "Mild upward trend in white blood cells over recent spring months, commonly seen during mild seasonal allergies or recovery."
  },
  glucose: {
    name: "Fasting Blood Sugar",
    unit: "mg/dL",
    normalMin: 70,
    normalMax: 99,
    history: [
      { date: "Dec '24", value: 98, status: "Normal" },
      { date: "Feb '25", value: 92, status: "Normal" },
      { date: "Apr '25", value: 94, status: "Normal" }
    ],
    aiInsight: "Fasting glucose remains well within the tight healthy window of 70–99 mg/dL with excellent insulin sensitivity."
  },
  cholesterol: {
    name: "Total Cholesterol",
    unit: "mg/dL",
    normalMin: 125,
    normalMax: 200,
    history: [
      { date: "Dec '24", value: 208, status: "Slightly Elevated" },
      { date: "Feb '25", value: 198, status: "Normal" },
      { date: "Apr '25", value: 192, status: "Normal" }
    ],
    aiInsight: "Total cholesterol has dropped 16 mg/dL since December 2024, successfully falling below the 200 mg/dL target threshold."
  }
};

export const AI_KNOWLEDGE_BASE = [
  {
    triggers: ["latest", "explain", "recent", "report", "blood", "test"],
    question: "Explain my latest report",
    answer: "Your latest CBC from April 26 at Apollo Hospital shows very healthy overall parameters. Your Hemoglobin (13.2 g/dL) is well within the normal range (12.0–16.0 g/dL). Your WBC is slightly elevated at 11.2 K/μL, which typically indicates a mild immune response or recovery from recent allergy or cold. Platelets (240 K/μL) and fasting glucose (94 mg/dL) are completely normal.",
    sources: ["Blood Test Report — Apr 26, 2025", "Apollo Multispeciality Hospital"]
  },
  {
    triggers: ["mean", "results", "overview", "what do these results mean"],
    question: "What do these results mean?",
    answer: "Across your visits at Apollo Hospital and Metropolis, your cardiovascular and metabolic markers show steady improvement. Your cholesterol has decreased from 208 mg/dL to 192 mg/dL. Your blood sugar is consistently non-diabetic (HbA1c 5.4%), and thyroid function is optimal. The only area to monitor is continuing your Vitamin D3 supplement.",
    sources: ["Comprehensive Lipid Profile", "Metropolis Diagnostics"]
  },
  {
    triggers: ["hemoglobin", "iron", "anemia", "oxygen"],
    question: "Is my hemoglobin normal?",
    answer: "Yes, absolutely! Your hemoglobin is 13.2 g/dL, which is right in the ideal window of 12.0 - 16.0 g/dL for adult females. This indicates healthy red blood cell counts and oxygen delivery to your muscles and brain.",
    sources: ["Blood Test Report — Apr 26, 2025"]
  },
  {
    triggers: ["wbc", "white blood cell", "elevated", "infection", "immune"],
    question: "Why is my WBC count slightly elevated?",
    answer: "A WBC count of 11.2 K/μL is only slightly above the standard threshold of 10.5 K/μL. Mild elevations are common and usually benign, often caused by mild seasonal allergies, vigorous exercise, psychological stress, or recovering from a minor bug. If you feel healthy, it's typically rechecked at your next routine visit.",
    sources: ["Blood Test Report — Apr 26, 2025"]
  },
  {
    triggers: ["cholesterol", "lipid", "heart", "hdl", "ldl"],
    question: "How is my cholesterol trending?",
    answer: "Your cholesterol trend is positive! You've moved from 208 mg/dL (borderline high in Dec 2024) down to 198 mg/dL in Feb 2025, and down to 192 mg/dL recently. Your protective HDL cholesterol remains healthy at 56 mg/dL.",
    sources: ["Comprehensive Lipid Profile — Feb 14, 2025"]
  }
];
