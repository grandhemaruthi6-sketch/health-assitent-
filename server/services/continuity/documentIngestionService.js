import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';
import {
  normalize_med_name,
  normalize_dose,
  normalize_frequency,
  normalize_lab_name
} from './normalizer.js';
import { run_continuity_engine } from './continuityEngine.js';
import { extractClinicalFields } from '../clinical/clinicalParser.js';

/**
 * Parses lines of text to identify prescribed medications.
 * Recognizes forms like:
 * "1. Tab Metformin 500mg BID"
 * "Amlodipine 5mg OD"
 * "Atorvastatin 10 mg at bedtime"
 * "Paracetamol 650mg SOS"
 */
export function extractMedicationsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const meds = [];
  const lines = text.split(/\r?\n/);

  // Common medication patterns
  const medRegex = /(?:(?:\d+[\.\)]\s*)|(?:•\s*)|(?:-\s*))?(?:(?:Tab|Tablet|Cap|Capsule|Inj|Injection|Syr|Syrup)\.?\s+)?([A-Za-z][A-Za-z0-9\s\-\/\+]{2,30}?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?)?(?:\s*[-–,\/]\s*|\s+)(OD|BID|TID|QID|Q4H|Q6H|Q8H|Q12H|HS|PRN|SOS|once daily|twice daily|thrice daily|at bedtime|daily|as needed)?/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter out common lab headers or non-medication lines
    if (/(blood|urine|hemoglobin|platelet|creatinine|glucose|hba1c|hospital|doctor|patient|date|history|complaint|diagnos)/i.test(trimmed)) {
      continue;
    }

    const match = trimmed.match(medRegex);
    if (match) {
      const rawName = match[1].trim();
      const rawDose = match[2].trim();
      const rawUnit = (match[3] || 'mg').trim();
      const rawFreq = (match[4] || '').trim();

      // Normalize
      const normName = normalize_med_name(rawName);
      const normDose = normalize_dose(rawDose, rawUnit);
      const normFreq = normalize_frequency(rawFreq);

      // Low confidence if frequency is missing or unknown
      const needsConfirm = normFreq.needs_confirmation ? 1 : 0;
      const confidence = normFreq.needs_confirmation ? 0.65 : 0.95;

      meds.push({
        name_raw: rawName,
        name_normalized: normName.canonical_name,
        dose_value: normDose.value,
        dose_unit: normDose.unit,
        frequency_normalized: normFreq.canonical_code,
        frequency_raw: rawFreq,
        extraction_confidence: confidence,
        needs_confirmation: needsConfirm
      });
    }
  }

  return meds;
}

/**
 * Ingests a document's OCR content into the continuity relational schema:
 * - Creates/links patient and visit if needed
 * - Inserts normalized medications into `medications`
 * - Inserts normalized lab results into `lab_results`
 * - Inserts note text into `clinical_notes`
 * - Runs the continuity engine and returns results
 * 
 * @param {string} documentId 
 * @param {object} [options]
 * @returns {object} { document, medicationsCount, labsCount, continuityRun }
 */
export function processDocumentForContinuity(documentId, options = {}) {
  // Find document in documents table or medical_reports table
  let doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

  if (!doc) {
    // Check medical_reports table from existing schema
    const report = db.prepare('SELECT * FROM medical_reports WHERE id = ?').get(documentId);
    if (!report) {
      throw new Error(`Document ${documentId} not found in available records.`);
    }

    // Ensure a patient exists for report.user_id
    let patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(report.user_id);
    const nowIso = new Date().toISOString();
    if (!patient) {
      const patientId = uuidv4();
      db.prepare(`
        INSERT INTO patients (id, user_id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(patientId, report.user_id, report.patient_name || 'Patient', nowIso, nowIso);
      patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    }

    // Ensure a visit exists
    let visit = null;
    if (report.visit_id) {
      visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(report.visit_id);
      if (!visit) {
        // Link to existing hospital_visit if present
        const hospVisit = db.prepare('SELECT * FROM hospital_visits WHERE id = ?').get(report.visit_id);
        const visitDate = hospVisit ? hospVisit.visit_date : (report.report_date || nowIso.split('T')[0]);
        const docName = hospVisit ? hospVisit.physician_name : report.physician_name;
        db.prepare(`
          INSERT INTO visits (id, patient_id, hospital_id, visit_date, doctor_name, department, reason_for_visit, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          report.visit_id,
          patient.id,
          report.hospital_id || null,
          visitDate,
          docName || 'Treating Clinician',
          report.category || 'General',
          report.notes || null,
          nowIso
        );
        visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(report.visit_id);
      }
    } else {
      // Create new visit for this document
      const newVisitId = uuidv4();
      const visitDate = report.report_date || nowIso.split('T')[0];
      db.prepare(`
        INSERT INTO visits (id, patient_id, hospital_id, visit_date, doctor_name, department, reason_for_visit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newVisitId,
        patient.id,
        report.hospital_id || null,
        visitDate,
        report.physician_name || 'Treating Clinician',
        report.category || 'General',
        report.notes || null,
        nowIso
      );
      visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(newVisitId);
    }

    // Create entry in documents table
    const docType = report.category === 'prescription' ? 'prescription'
      : (report.category === 'lab_report' ? 'lab' : 'note');

    db.prepare(`
      INSERT INTO documents (id, patient_id, visit_id, type, title, file_url, ocr_text, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.id,
      patient.id,
      visit.id,
      docType,
      report.file_name || 'Medical Document',
      report.file_path || '',
      report.raw_ocr_text || '',
      report.created_at || nowIso
    );

    doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(report.id);
  }

  const patientId = doc.patient_id;
  const visitId = doc.visit_id;
  const now = new Date().toISOString();
  let medicationsCount = 0;
  let labsCount = 0;

  // 1. Ingest Medications
  if (doc.type === 'prescription' || doc.type === 'note' || options.extractMedications) {
    const extractedMeds = extractMedicationsFromText(doc.ocr_text);
    const insertMed = db.prepare(`
      INSERT INTO medications (
        id, patient_id, visit_id, document_id, name_raw, name_normalized,
        dose_value, dose_unit, frequency_normalized, frequency_raw,
        extraction_confidence, needs_confirmation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of extractedMeds) {
      insertMed.run(
        uuidv4(),
        patientId,
        visitId,
        doc.id,
        m.name_raw,
        m.name_normalized,
        m.dose_value,
        m.dose_unit,
        m.frequency_normalized,
        m.frequency_raw,
        m.extraction_confidence,
        m.needs_confirmation,
        now
      );
      medicationsCount++;
    }
  }

  // 2. Ingest Lab Results
  if (doc.type === 'lab' || options.extractLabs) {
    try {
      const parsed = extractClinicalFields({ fullText: doc.ocr_text, pages: [{ text: doc.ocr_text }] }, 'Lab Report');
      const findings = parsed?.labResults || [];
      if (findings.length > 0) {
        const insertLab = db.prepare(`
          INSERT INTO lab_results (
            id, patient_id, visit_id, document_id, test_name_raw, test_name_normalized,
            value_num, unit, ref_range, result_date, extraction_confidence, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Fetch visit date
        const v = db.prepare('SELECT visit_date FROM visits WHERE id = ?').get(visitId);
        const resultDate = v ? v.visit_date : now.split('T')[0];

        for (const item of findings) {
          const rawName = item.testName || item.name || '';
          const normLab = normalize_lab_name(rawName);
          const valNum = typeof item.value === 'number' ? item.value : parseFloat(item.value);

          insertLab.run(
            uuidv4(),
            patientId,
            visitId,
            doc.id,
            rawName,
            normLab.canonical_name,
            isNaN(valNum) ? null : valNum,
            item.unit || normLab.canonical_unit,
            item.referenceRange?.raw || (typeof item.referenceRange === 'string' ? item.referenceRange : ''),
            resultDate,
            item.confidence || 0.9,
            now
          );
          labsCount++;
        }
      }
    } catch (parseErr) {
      console.warn('[Continuity Document Ingestion] Lab parsing warning:', parseErr.message);
    }
  }

  // 3. Ingest Clinical Notes
  if (doc.ocr_text && doc.ocr_text.trim().length > 0) {
    const v = db.prepare('SELECT visit_date FROM visits WHERE id = ?').get(visitId);
    const noteDate = v ? v.visit_date : now.split('T')[0];

    db.prepare(`
      INSERT INTO clinical_notes (id, patient_id, visit_id, document_id, text, note_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      patientId,
      visitId,
      doc.id,
      doc.ocr_text,
      noteDate,
      now
    );
  }

  // 4. Run Continuity Engine
  const continuityRun = run_continuity_engine(patientId);

  return {
    success: true,
    documentId: doc.id,
    patientId,
    medicationsCount,
    labsCount,
    continuityRun
  };
}
