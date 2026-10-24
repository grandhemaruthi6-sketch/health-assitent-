# Medical Document Understanding Pipeline Guide

## Overview

The Medical Document Understanding Pipeline sits directly on top of the raw OCR extraction layer (Google Cloud Document AI / OCR abstraction). It provides:
1. **Multi-category document classification** (8 distinct clinical categories).
2. **Schema-validated clinical entity extraction** (Zod-validated).
3. **Evidence-linked field citations** (page number, raw text snippet, confidence).
4. **Uncertainty & conflict detection** (flagged for review, never silently guessed).
5. **Zero vs. Missing distinction** (preserves difference between a reading of 0 vs absent).
6. **Medication safety rules** (preserves prescriptions as written without generating drug advice).
7. **Plain-language patient summaries** with mandatory clinical disclaimers.

---

## 1. Document Classification Categories

The classifier categorizes documents into the following 8 categories:

| Category | Typical Document Types | Key Classification Signals |
|---|---|---|
| **Lab Report** | CBC, Lipid Panel, Metabolic Panels, Urinalysis | `pathology`, `reference interval`, `observed value`, biomarker units (`mg/dL`, `g/dL`) |
| **Discharge Summary/Letter** | Inpatient hospital discharge, Day care discharge | `discharge summary`, `date of admission`, `condition at discharge`, `discharge diagnosis` |
| **Prescription** | Outpatient prescription slips, Rx orders | `prescription`, `Rx`, `sig:`, dosage patterns (`500 mg`, `daily`, `po`) |
| **Scan/Imaging Report** | X-Ray, CT, MRI, Ultrasound reports | `radiology report`, `findings:`, `impression:`, anatomical regions, imaging technique |
| **Doctor Consultation/Clinical Notes** | OPD consult sheets, Progress notes | `chief complaint`, `HPI`, `physical examination`, `assessment & plan` |
| **Vaccination Record** | Immunization certificates, Vaccine cards | `vaccination record`, `dose number`, `lot number`, `administered on` |
| **Medical Certificate** | Sick leave slips, Fitness certificates | `medical certificate`, `suffering from`, `advised rest for`, `fit to resume` |
| **Other** | Invoices, non-clinical forms, unclassifiable documents | Absence of clinical keywords or insufficient signal confidence (< 0.50) |

---

## 2. Core Clinical Truthfulness & Safety Rules

### Rule 1: No Value Fabrication
- **Rule**: If a biomarker, medication, diagnosis, or date is not explicitly present in the document text, the pipeline **NEVER** hallucinates or invents a default value.
- **Representation**: Missing fields are explicitly marked with:
  ```json
  {
    "presence": "MISSING",
    "rawSnippet": null,
    "value": null
  }
  ```

### Rule 2: Distinction Between Value = 0 and Missing
- **Rule**: A reading of zero (e.g. `Fasting Glucose: 0 mg/dL` or `Protein: 0`) is clinically distinct from an unmeasured test.
- **Representation**:
  - Value 0: `{ "numericValue": 0, "isZero": true, "presence": "EXPLICIT" }`
  - Missing: `{ "numericValue": null, "isZero": false, "presence": "MISSING" }`

### Rule 3: Conflicting Values Flagged for Review
- **Rule**: When OCR text contains contradictory readings across pages or sections (e.g., `Hemoglobin: 14.2 g/dL` on Page 1 and `Hemoglobin: 11.2 g/dL` on Page 2), the pipeline does NOT silently choose one.
- **Representation**:
  ```json
  "flags": {
    "isConflicting": true,
    "needsUserReview": true,
    "reviewReason": "Conflicting values found: 14.2, 11.2 across pages."
  },
  "conflictingReadings": [
    { "pageNumber": 1, "value": "14.2", "snippet": "Hemoglobin: 14.2 g/dL (Normal)" },
    { "pageNumber": 2, "value": "11.2", "snippet": "Hemoglobin: 11.2 g/dL (Low reading)" }
  ]
  ```

### Rule 4: Medication Safety & As-Written Instructions
- **Rule**: The system never independently recommends starting, altering, or stopping medication.
- **Representation**: Instructions are captured as written (`instructionsAsWritten`). If a prescription states vague instructions like `"as directed"`, the pipeline flags `needsUserReview: true` and generates a question prompt for the patient's prescribing physician.

---

## 3. Evidence-Linked Schema Reference

Every extracted entity includes an `evidence` object:

```json
"evidence": {
  "presence": "EXPLICIT",
  "pageNumber": 1,
  "rawSnippet": "Hemoglobin (Hb): 14.2 g/dL (12.0 - 16.0)",
  "confidence": 0.985
}
```

---

## 4. API Endpoints

### 1. `GET /api/clinical/categories`
Returns the 8 supported categories:
```bash
curl http://localhost:5001/api/clinical/categories
```

### 2. `POST /api/clinical/analyze`
Accepts multipart file upload or pre-extracted OCR result:

```http
POST /api/clinical/analyze HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "ocrResult": {
    "documentId": "doc-uuid",
    "provider": "google-cloud-documentai",
    "fullText": "APOLLO CLINICAL LABORATORY REPORT\nHemoglobin: 14.2 g/dL...",
    "pages": [...]
  }
}
```

---

## 5. Automated Verification

Run the complete 55-test verification suite:
```bash
npm run test:all
```
- `npm run test:ocr` (23 tests — Document validation, signatures, multi-page PDFs, provider safety)
- `npm run test:clinical` (32 tests — Classification across 8 categories, zero vs missing, conflict handling, medication safety, Zod schema validation)
