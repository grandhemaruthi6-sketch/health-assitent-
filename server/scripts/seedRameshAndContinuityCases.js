import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { run_continuity_engine } from '../services/continuity/continuityEngine.js';

/**
 * Seeds patient Ramesh Sharma and executes the continuity engine.
 * Validates deterministic ground truth:
 * - Metformin changed from 1000mg BID to 1000mg OD on Jun 20 -> MED_FREQ_CHANGE with reason 'not_found'
 * - Clinical note references MRI Lumbar Spine, but no MRI document exists -> MISSING_EVIDENCE with 'not_found'
 * - HbA1c changed 7.9% -> 7.8% on Jun 20 (delta 0.1 < 0.5 threshold) -> ZERO false lab alert
 */
export function seedRamesh() {
  const patientId = 'patient-ramesh-001';
  const now = new Date().toISOString();

  // Clear existing records for Ramesh
  db.prepare('DELETE FROM patients WHERE id = ?').run(patientId);

  // 1. Patient Ramesh
  db.prepare(`
    INSERT INTO patients (id, user_id, name, age, gender, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(patientId, 'user-ramesh-001', 'Ramesh Sharma', 58, 'Male', now, now);

  // 2. Visits
  const visit1Id = 'visit-ramesh-v1';
  const visit2Id = 'visit-ramesh-v2';
  const visit3Id = 'visit-ramesh-v3';

  // Visit 1: Jan 10, 2026
  db.prepare(`
    INSERT INTO visits (id, patient_id, hospital_id, visit_date, doctor_name, department, reason_for_visit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(visit1Id, patientId, 'hosp-apollo', '2026-01-10', 'Dr. Ramesh Rao', 'Endocrinology', 'Regular Diabetes Checkup', now);

  // Visit 2: Mar 15, 2026
  db.prepare(`
    INSERT INTO visits (id, patient_id, hospital_id, visit_date, doctor_name, department, reason_for_visit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(visit2Id, patientId, 'hosp-apollo', '2026-03-15', 'Dr. Ramesh Rao', 'Endocrinology', 'Uncontrolled Sugars Evaluation', now);

  // Visit 3: Jun 20, 2026
  db.prepare(`
    INSERT INTO visits (id, patient_id, hospital_id, visit_date, doctor_name, department, reason_for_visit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(visit3Id, patientId, 'hosp-apollo', '2026-06-20', 'Dr. Ramesh Rao', 'Endocrinology', 'Quarterly Review & Back Pain', now);

  // 3. Documents
  const doc1Id = 'doc-ramesh-v1';
  const doc2Id = 'doc-ramesh-v2';
  const doc3Id = 'doc-ramesh-v3';

  db.prepare(`
    INSERT INTO documents (id, patient_id, visit_id, type, title, file_url, ocr_text, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(doc1Id, patientId, visit1Id, 'prescription', 'Prescription Jan 10', '/uploads/v1.pdf', 'Tab Metformin 500mg BID. Tab Amlodipine 5mg OD.', now);

  db.prepare(`
    INSERT INTO documents (id, patient_id, visit_id, type, title, file_url, ocr_text, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(doc2Id, patientId, visit2Id, 'note', 'Clinical Note Mar 15', '/uploads/v2.pdf', 'Patient has uncontrolled sugars. Increasing Metformin dose. Tab Metformin 1000mg BID. Tab Amlodipine 5mg OD.', now);

  db.prepare(`
    INSERT INTO documents (id, patient_id, visit_id, type, title, file_url, ocr_text, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(doc3Id, patientId, visit3Id, 'note', 'Clinical Note Jun 20', '/uploads/v3.pdf', 'Routine review. Patient complains of severe lower back pain radiating to left leg. Advised MRI lumbar spine. Rx: Tab Metformin 1000mg OD. Tab Amlodipine 5mg OD.', now);

  // 4. Medications
  // Visit 1: Metformin 500mg BID, Amlodipine 5mg OD
  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r1', patientId, visit1Id, doc1Id, 'Tab Metformin 500mg', 'Metformin', 500, 'mg', 'BID', 'BID', 0.95, 0, now);

  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r2', patientId, visit1Id, doc1Id, 'Tab Amlodipine 5mg', 'Amlodipine', 5, 'mg', 'OD', 'OD', 0.95, 0, now);

  // Visit 2: Metformin 1000mg BID (Dose increased with documented reason: "uncontrolled sugars")
  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r3', patientId, visit2Id, doc2Id, 'Tab Metformin 1000mg', 'Metformin', 1000, 'mg', 'BID', 'BID', 0.95, 0, now);

  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r4', patientId, visit2Id, doc2Id, 'Tab Amlodipine 5mg', 'Amlodipine', 5, 'mg', 'OD', 'OD', 0.95, 0, now);

  // Visit 3: Metformin 1000mg OD (Frequency decreased from BID to OD with NO documented reason in notes!)
  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r5', patientId, visit3Id, doc3Id, 'Tab Metformin 1000mg', 'Metformin', 1000, 'mg', 'OD', 'OD', 0.95, 0, now);

  db.prepare(`
    INSERT INTO medications (id, patient_id, visit_id, document_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, frequency_raw, extraction_confidence, needs_confirmation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('med-r6', patientId, visit3Id, doc3Id, 'Tab Amlodipine 5mg', 'Amlodipine', 5, 'mg', 'OD', 'OD', 0.95, 0, now);

  // 5. Clinical Notes
  db.prepare(`
    INSERT INTO clinical_notes (id, patient_id, visit_id, document_id, text, note_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('note-r2', patientId, visit2Id, doc2Id, 'Increasing Metformin dose to 1000mg BID due to uncontrolled blood sugars.', '2026-03-15', now);

  db.prepare(`
    INSERT INTO clinical_notes (id, patient_id, visit_id, document_id, text, note_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('note-r3', patientId, visit3Id, doc3Id, 'Routine quarterly check. Patient reports severe lower back pain radiating to left leg. Advised MRI lumbar spine.', '2026-06-20', now);

  // 6. Lab Results (HbA1c)
  // Visit 1: 7.1%
  db.prepare(`
    INSERT INTO lab_results (id, patient_id, visit_id, document_id, test_name_raw, test_name_normalized, value_num, unit, ref_range, result_date, extraction_confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('lab-r1', patientId, visit1Id, doc1Id, 'HbA1c', 'HbA1c', 7.1, '%', '< 5.7', '2026-01-10', 0.98, now);

  // Visit 2: 7.9% (Significant jump from 7.1% -> delta 0.8 > 0.5 threshold)
  db.prepare(`
    INSERT INTO lab_results (id, patient_id, visit_id, document_id, test_name_raw, test_name_normalized, value_num, unit, ref_range, result_date, extraction_confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('lab-r2', patientId, visit2Id, doc2Id, 'HbA1c', 'HbA1c', 7.9, '%', '< 5.7', '2026-03-15', 0.98, now);

  // Visit 3: 7.8% (Delta from 7.9 is 0.1, well below 0.5 threshold -> ZERO false alert!)
  db.prepare(`
    INSERT INTO lab_results (id, patient_id, visit_id, document_id, test_name_raw, test_name_normalized, value_num, unit, ref_range, result_date, extraction_confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('lab-r3', patientId, visit3Id, doc3Id, 'HbA1c', 'HbA1c', 7.8, '%', '< 5.7', '2026-06-20', 0.98, now);

  // Run the continuity engine
  const runResult = run_continuity_engine(patientId);
  return { patientId, runResult };
}

/**
 * Seeds 15 diverse synthetic continuity test cases covering all edge cases.
 */
export function seedSyntheticBenchmarkSuite() {
  const cases = [
    // Case 1: Brand vs Generic equivalence (Paracetamol vs Calpol) -> No false alert
    { id: 'pat-synth-01', name: 'Brand Generic Equivalence', type: 'equiv', med1: 'Calpol 500mg', med2: 'Paracetamol 500mg', freq: 'TID' },
    // Case 2: Metformin Dose Increase with documented reason
    { id: 'pat-synth-02', name: 'Documented Dose Increase', type: 'doc_dose', med1: 'Metformin 500mg', med2: 'Metformin 1000mg', freq: 'BID', reason: 'Uncontrolled diabetes' },
    // Case 3: Medication Stopped without documented reason
    { id: 'pat-synth-03', name: 'Undocumented Med Stop', type: 'med_stopped', med1: 'Atorvastatin 20mg', med2: null, freq: 'OD' },
    // Case 4: Medication Added without documented reason
    { id: 'pat-synth-04', name: 'Undocumented Med Added', type: 'med_added', med1: null, med2: 'Telmisartan 40mg', freq: 'OD' },
    // Case 5: Frequency Change without reason
    { id: 'pat-synth-05', name: 'Undocumented Freq Change', type: 'freq_change', med1: 'Levothyroxine 50mcg', med2: 'Levothyroxine 50mcg', freq1: 'OD', freq2: 'BID' },
    // Case 6: Lab WBC Spike > 50%
    { id: 'pat-synth-06', name: 'WBC Significant Jump', type: 'lab_wbc', lab1: 7000, lab2: 14500 },
    // Case 7: Lab Platelet Drop > 40%
    { id: 'pat-synth-07', name: 'Platelet Crash', type: 'lab_plt', lab1: 250000, lab2: 95000 },
    // Case 8: Lab Creatinine Spike > 30%
    { id: 'pat-synth-08', name: 'Creatinine Rise', type: 'lab_cr', lab1: 1.0, lab2: 1.6 },
    // Case 9: Missing Evidence CT Chest
    { id: 'pat-synth-09', name: 'Missing CT Scan', type: 'missing_ct', note: 'Advised CT scan chest for persistent cough' },
    // Case 10: Found Evidence X-Ray (Report is uploaded) -> Zero alert
    { id: 'pat-synth-10', name: 'Present X-Ray Evidence', type: 'present_xray', note: 'Reviewed X-ray chest', docType: 'imaging', docTitle: 'Chest X-Ray' },
    // Case 11: Unknown frequency format -> needs_confirmation: 1
    { id: 'pat-synth-11', name: 'Unparsed Frequency Safeguard', type: 'unparsed_freq', med: 'Gabapentin 300mg', rawFreq: 'special cyclic pattern' },
    // Case 12: Lab normal fluctuation within threshold (Creatinine 1.0 -> 1.05) -> Zero alert
    { id: 'pat-synth-12', name: 'Lab Noise Abstention', type: 'lab_noise', lab1: 1.0, lab2: 1.05 },
    // Case 13: Missing Follow-up test
    { id: 'pat-synth-13', name: 'Overdue Follow-up', type: 'followup', note: 'Repeat Serum Creatinine after 2 weeks' },
    // Case 14: Doctor Review Intentional Confirmation
    { id: 'pat-synth-14', name: 'Doctor Reviewed Resolution', type: 'reviewed_case', med1: 'Aspirin 75mg', med2: null, freq: 'OD' },
    // Case 15: Decision Memory Recall
    { id: 'pat-synth-15', name: 'Decision Memory Case', type: 'decision_memory', med1: 'Metoprolol 25mg', med2: 'Metoprolol 50mg', freq: 'OD' }
  ];

  const now = new Date().toISOString();

  for (const c of cases) {
    db.prepare('DELETE FROM patients WHERE id = ?').run(c.id);
    db.prepare(`
      INSERT INTO patients (id, user_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(c.id, `user-${c.id}`, c.name, now, now);

    const v1 = `visit-${c.id}-v1`;
    const v2 = `visit-${c.id}-v2`;

    db.prepare(`
      INSERT INTO visits (id, patient_id, visit_date, doctor_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(v1, c.id, '2026-02-01', 'Dr. Smith', now);

    db.prepare(`
      INSERT INTO visits (id, patient_id, visit_date, doctor_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(v2, c.id, '2026-04-01', 'Dr. Smith', now);

    if (c.type === 'equiv') {
      db.prepare(`
        INSERT INTO medications (id, patient_id, visit_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`m1-${c.id}`, c.id, v1, 'Calpol 500mg', 'Paracetamol', 500, 'mg', 'TID', now);

      db.prepare(`
        INSERT INTO medications (id, patient_id, visit_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`m2-${c.id}`, c.id, v2, 'Paracetamol 500mg', 'Paracetamol', 500, 'mg', 'TID', now);
    } else if (c.type === 'doc_dose') {
      db.prepare(`
        INSERT INTO medications (id, patient_id, visit_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`m1-${c.id}`, c.id, v1, 'Metformin 500mg', 'Metformin', 500, 'mg', 'BID', now);

      db.prepare(`
        INSERT INTO medications (id, patient_id, visit_id, name_raw, name_normalized, dose_value, dose_unit, frequency_normalized, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`m2-${c.id}`, c.id, v2, 'Metformin 1000mg', 'Metformin', 1000, 'mg', 'BID', now);

      db.prepare(`
        INSERT INTO clinical_notes (id, patient_id, visit_id, text, note_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`n2-${c.id}`, c.id, v2, 'Increasing Metformin due to uncontrolled diabetes.', '2026-04-01', now);
    } else if (c.type === 'lab_wbc') {
      db.prepare(`
        INSERT INTO lab_results (id, patient_id, visit_id, test_name_raw, test_name_normalized, value_num, unit, result_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`l1-${c.id}`, c.id, v1, 'WBC', 'Total WBC Count', c.lab1, 'cells/mcL', '2026-02-01', now);

      db.prepare(`
        INSERT INTO lab_results (id, patient_id, visit_id, test_name_raw, test_name_normalized, value_num, unit, result_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`l2-${c.id}`, c.id, v2, 'WBC', 'Total WBC Count', c.lab2, 'cells/mcL', '2026-04-01', now);
    } else if (c.type === 'lab_noise') {
      db.prepare(`
        INSERT INTO lab_results (id, patient_id, visit_id, test_name_raw, test_name_normalized, value_num, unit, result_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`l1-${c.id}`, c.id, v1, 'Creatinine', 'Serum Creatinine', c.lab1, 'mg/dL', '2026-02-01', now);

      db.prepare(`
        INSERT INTO lab_results (id, patient_id, visit_id, test_name_raw, test_name_normalized, value_num, unit, result_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`l2-${c.id}`, c.id, v2, 'Creatinine', 'Serum Creatinine', c.lab2, 'mg/dL', '2026-04-01', now);
    } else if (c.type === 'missing_ct') {
      db.prepare(`
        INSERT INTO clinical_notes (id, patient_id, visit_id, text, note_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`n-${c.id}`, c.id, v2, c.note, '2026-04-01', now);
    } else if (c.type === 'present_xray') {
      db.prepare(`
        INSERT INTO clinical_notes (id, patient_id, visit_id, text, note_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`n-${c.id}`, c.id, v2, c.note, '2026-04-01', now);

      db.prepare(`
        INSERT INTO documents (id, patient_id, visit_id, type, title, file_url, ocr_text, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`doc-${c.id}`, c.id, v2, 'imaging', 'Chest X-Ray Report', '/xray.pdf', 'Chest X-Ray shows normal lung fields.', now);
    }

    run_continuity_engine(c.id);
  }

  return { seededCount: cases.length };
}

// Run if called directly
if (process.argv[1]?.endsWith('seedRameshAndContinuityCases.js')) {
  console.log('[Seeding Ramesh Sharma Benchmark]...');
  const rameshResult = seedRamesh();
  console.log('Ramesh seed complete:', rameshResult);

  console.log('[Seeding Synthetic Benchmark Suite]...');
  const synthResult = seedSyntheticBenchmarkSuite();
  console.log('Synthetic benchmark suite complete:', synthResult);
}
