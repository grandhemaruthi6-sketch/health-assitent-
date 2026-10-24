import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';
import thresholdsConfig from './thresholds.json' with { type: 'json' };
import { find_continuity_reason } from './reasonFinder.js';
import { check_patient_evidence_chain } from './evidenceChain.js';

/**
 * Compares medications across consecutive visits for a patient.
 * Emits MED_DOSE_CHANGE, MED_FREQ_CHANGE, MED_ADDED, or MED_STOPPED.
 * Ignores cosmetic differences (case, brand vs generic, canonical unit formats).
 * 
 * @param {string} patientId 
 * @returns {Array<object>} Created issues
 */
export function compare_medications(patientId) {
  if (!patientId) return [];

  // Fetch all medications for this patient joined with visit dates
  const medRows = db.prepare(`
    SELECT m.*, v.visit_date, v.doctor_name, v.hospital_id
    FROM medications m
    JOIN visits v ON v.id = m.visit_id
    WHERE m.patient_id = ?
    ORDER BY v.visit_date ASC, m.created_at ASC
  `).all(patientId);

  if (medRows.length === 0) return [];

  // Group by distinct visit_date
  const visitsByDate = new Map();
  for (const m of medRows) {
    if (!visitsByDate.has(m.visit_date)) {
      visitsByDate.set(m.visit_date, []);
    }
    visitsByDate.get(m.visit_date).push(m);
  }

  const sortedDates = Array.from(visitsByDate.keys()).sort();
  const createdIssues = [];
  const now = new Date().toISOString();

  // Compare consecutive visits
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const beforeDate = sortedDates[i];
    const afterDate = sortedDates[i + 1];

    const beforeMeds = visitsByDate.get(beforeDate);
    const afterMeds = visitsByDate.get(afterDate);

    // Map by normalized medication name
    const beforeMap = new Map();
    for (const bm of beforeMeds) {
      beforeMap.set(bm.name_normalized, bm);
    }

    const afterMap = new Map();
    for (const am of afterMeds) {
      afterMap.set(am.name_normalized, am);
    }

    // 1. Check changes in existing medications & stopped medications
    for (const [normName, bm] of beforeMap.entries()) {
      const am = afterMap.get(normName);

      if (!am) {
        // Medication was present in beforeDate but omitted in afterDate -> MED_STOPPED
        const issueType = 'MED_STOPPED';
        const severity = thresholdsConfig.severity_defaults[issueType] || 'medium';

        const existingIssue = db.prepare(`
          SELECT id FROM continuity_issues
          WHERE patient_id = ? AND issue_type = ? AND before_ref = ?
        `).get(patientId, issueType, bm.id);

        if (!existingIssue) {
          const reasonObj = find_continuity_reason(patientId, {
            itemName: normName,
            rawName: bm.name_raw,
            beforeDate,
            afterDate
          });

          const summary = {
            medication: normName,
            before: { date: beforeDate, raw_name: bm.name_raw, dose: `${bm.dose_value} ${bm.dose_unit}`, frequency: bm.frequency_normalized },
            after: { date: afterDate, status: 'discontinued_or_omitted' },
            finding: `${bm.name_raw} was discontinued or omitted between ${beforeDate} and ${afterDate}.`
          };

          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            issueType,
            severity,
            bm.id,
            null,
            JSON.stringify(summary),
            reasonObj.reason_status,
            reasonObj.reason_text,
            reasonObj.reason_source_document_id,
            reasonObj.reason_status === 'documented' ? 'detected' : 'needs_patient_confirmation',
            now,
            now
          );

          createdIssues.push({ id: issueId, issueType, medication: normName });
        }
        continue;
      }

      // Both before and after exist -> Compare Dose and Frequency
      // A. Frequency Change
      const isFreqChanged = bm.frequency_normalized && am.frequency_normalized &&
        bm.frequency_normalized !== am.frequency_normalized;

      if (isFreqChanged) {
        const issueType = 'MED_FREQ_CHANGE';
        const severity = thresholdsConfig.severity_defaults[issueType] || 'medium';

        const existingIssue = db.prepare(`
          SELECT id FROM continuity_issues
          WHERE patient_id = ? AND issue_type = ? AND before_ref = ? AND after_ref = ?
        `).get(patientId, issueType, bm.id, am.id);

        if (!existingIssue) {
          const reasonObj = find_continuity_reason(patientId, {
            itemName: normName,
            rawName: am.name_raw,
            beforeDate,
            afterDate
          });

          const summary = {
            medication: normName,
            before: { date: beforeDate, raw_name: bm.name_raw, frequency: bm.frequency_normalized },
            after: { date: afterDate, raw_name: am.name_raw, frequency: am.frequency_normalized },
            change: `Frequency changed from ${bm.frequency_normalized} to ${am.frequency_normalized}`,
            finding: `${am.name_raw} frequency changed from ${bm.frequency_normalized} to ${am.frequency_normalized} on ${afterDate}.`
          };

          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            issueType,
            severity,
            bm.id,
            am.id,
            JSON.stringify(summary),
            reasonObj.reason_status,
            reasonObj.reason_text,
            reasonObj.reason_source_document_id,
            reasonObj.reason_status === 'documented' ? 'detected' : 'needs_patient_confirmation',
            now,
            now
          );

          createdIssues.push({ id: issueId, issueType, medication: normName });
        }
      }

      // B. Dose Change (compare canonical numeric dose)
      const isDoseChanged = bm.dose_value != null && am.dose_value != null &&
        bm.dose_value !== am.dose_value &&
        bm.dose_unit === am.dose_unit;

      if (isDoseChanged) {
        const issueType = 'MED_DOSE_CHANGE';
        const severity = thresholdsConfig.severity_defaults[issueType] || 'medium';

        const existingIssue = db.prepare(`
          SELECT id FROM continuity_issues
          WHERE patient_id = ? AND issue_type = ? AND before_ref = ? AND after_ref = ?
        `).get(patientId, issueType, bm.id, am.id);

        if (!existingIssue) {
          const reasonObj = find_continuity_reason(patientId, {
            itemName: normName,
            rawName: am.name_raw,
            beforeDate,
            afterDate
          });

          const summary = {
            medication: normName,
            before: { date: beforeDate, raw_name: bm.name_raw, dose: `${bm.dose_value} ${bm.dose_unit}` },
            after: { date: afterDate, raw_name: am.name_raw, dose: `${am.dose_value} ${am.dose_unit}` },
            change: `Dose changed from ${bm.dose_value} ${bm.dose_unit} to ${am.dose_value} ${am.dose_unit}`,
            finding: `${am.name_raw} dose changed from ${bm.dose_value} ${bm.dose_unit} to ${am.dose_value} ${am.dose_unit} on ${afterDate}.`
          };

          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            issueType,
            severity,
            bm.id,
            am.id,
            JSON.stringify(summary),
            reasonObj.reason_status,
            reasonObj.reason_text,
            reasonObj.reason_source_document_id,
            reasonObj.reason_status === 'documented' ? 'detected' : 'needs_patient_confirmation',
            now,
            now
          );

          createdIssues.push({ id: issueId, issueType, medication: normName });
        }
      }
    }

    // 2. Check newly added medications
    for (const [normName, am] of afterMap.entries()) {
      if (!beforeMap.has(normName)) {
        // Was not present in before visit -> newly added
        const issueType = 'MED_ADDED';
        const severity = thresholdsConfig.severity_defaults[issueType] || 'low';

        const existingIssue = db.prepare(`
          SELECT id FROM continuity_issues
          WHERE patient_id = ? AND issue_type = ? AND after_ref = ?
        `).get(patientId, issueType, am.id);

        if (!existingIssue) {
          const reasonObj = find_continuity_reason(patientId, {
            itemName: normName,
            rawName: am.name_raw,
            beforeDate,
            afterDate
          });

          const summary = {
            medication: normName,
            before: { date: beforeDate, status: 'not_prescribed' },
            after: { date: afterDate, raw_name: am.name_raw, dose: `${am.dose_value} ${am.dose_unit}`, frequency: am.frequency_normalized },
            finding: `Newly prescribed ${am.name_raw} (${am.dose_value} ${am.dose_unit} ${am.frequency_normalized}) on ${afterDate}.`
          };

          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            issueType,
            severity,
            null,
            am.id,
            JSON.stringify(summary),
            reasonObj.reason_status,
            reasonObj.reason_text,
            reasonObj.reason_source_document_id,
            reasonObj.reason_status === 'documented' ? 'detected' : 'needs_patient_confirmation',
            now,
            now
          );

          createdIssues.push({ id: issueId, issueType, medication: normName });
        }
      }
    }
  }

  return createdIssues;
}

/**
 * Compares laboratory results across consecutive visits.
 * Uses configurable thresholds table to prevent alert fatigue.
 * Emits LAB_SIGNIFICANT_CHANGE only when threshold is exceeded.
 * 
 * @param {string} patientId 
 * @returns {Array<object>} Created issues
 */
export function compare_labs(patientId) {
  if (!patientId) return [];

  const labRows = db.prepare(`
    SELECT l.*, v.visit_date
    FROM lab_results l
    JOIN visits v ON v.id = l.visit_id
    WHERE l.patient_id = ?
    ORDER BY l.test_name_normalized ASC, l.result_date ASC
  `).all(patientId);

  if (labRows.length === 0) return [];

  // Group by canonical lab name
  const labsByName = new Map();
  for (const lr of labRows) {
    if (!labsByName.has(lr.test_name_normalized)) {
      labsByName.set(lr.test_name_normalized, []);
    }
    labsByName.get(lr.test_name_normalized).push(lr);
  }

  const createdIssues = [];
  const now = new Date().toISOString();

  for (const [testName, results] of labsByName.entries()) {
    if (results.length < 2) continue;

    const thresholdRules = thresholdsConfig.lab_thresholds[testName] || thresholdsConfig.lab_thresholds.default;

    for (let i = 0; i < results.length - 1; i++) {
      const beforeLab = results[i];
      const afterLab = results[i + 1];

      if (beforeLab.value_num == null || afterLab.value_num == null) continue;

      const diff = Math.abs(afterLab.value_num - beforeLab.value_num);
      const isImprovement = (testName === 'hba1c' || testName === 'creatinine') && (afterLab.value_num < beforeLab.value_num);

      // Check if threshold exceeded
      let isSignificant = false;
      if (thresholdRules.min_change_absolute != null && diff >= thresholdRules.min_change_absolute) {
        if (!isImprovement || thresholdRules.alert_on_improvement) {
          isSignificant = true;
        }
      } else if (thresholdRules.min_change_percent != null) {
        const pct = (diff / Math.max(beforeLab.value_num, 0.001)) * 100;
        if (pct >= thresholdRules.min_change_percent) {
          if (!isImprovement || thresholdRules.alert_on_improvement) {
            isSignificant = true;
          }
        }
      }

      if (isSignificant) {
        const issueType = 'LAB_SIGNIFICANT_CHANGE';
        const severity = thresholdRules.severity || 'medium';

        const existingIssue = db.prepare(`
          SELECT id FROM continuity_issues
          WHERE patient_id = ? AND issue_type = ? AND before_ref = ? AND after_ref = ?
        `).get(patientId, issueType, beforeLab.id, afterLab.id);

        if (!existingIssue) {
          const reasonObj = find_continuity_reason(patientId, {
            itemName: testName,
            rawName: afterLab.test_name_raw,
            beforeDate: beforeLab.result_date,
            afterDate: afterLab.result_date
          });

          const summary = {
            test: testName,
            before: { date: beforeLab.result_date, value: beforeLab.value_num, unit: beforeLab.unit },
            after: { date: afterLab.result_date, value: afterLab.value_num, unit: afterLab.unit },
            delta: (afterLab.value_num - beforeLab.value_num).toFixed(2),
            finding: `${afterLab.test_name_raw} changed significantly from ${beforeLab.value_num} to ${afterLab.value_num} ${afterLab.unit || ''} on ${afterLab.result_date}.`
          };

          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            issueType,
            severity,
            beforeLab.id,
            afterLab.id,
            JSON.stringify(summary),
            reasonObj.reason_status,
            reasonObj.reason_text,
            reasonObj.reason_source_document_id,
            reasonObj.reason_status === 'documented' ? 'detected' : 'needs_patient_confirmation',
            now,
            now
          );

          createdIssues.push({ id: issueId, issueType, test: testName });
        }
      }
    }
  }

  return createdIssues;
}

/**
 * Checks clinical notes for follow-up reminders like "repeat X in N weeks".
 * If no matching result exists after that scheduled date, emits MISSING_FOLLOWUP.
 * 
 * @param {string} patientId 
 * @returns {Array<object>} Created issues
 */
export function check_followups(patientId) {
  if (!patientId) return [];

  const notes = db.prepare(`
    SELECT n.*, v.visit_date
    FROM clinical_notes n
    JOIN visits v ON v.id = n.visit_id
    WHERE n.patient_id = ?
    ORDER BY n.note_date ASC
  `).all(patientId);

  const labResults = db.prepare(`
    SELECT id, test_name_normalized, result_date
    FROM lab_results
    WHERE patient_id = ?
  `).all(patientId);

  const FOLLOWUP_REGEX = /\brepeat\s+([A-Za-z0-9\s]+?)\s+(?:in|after)\s+(\d+)\s*(weeks?|months?|days?)\b/i;
  const createdIssues = [];
  const now = new Date().toISOString();

  for (const note of notes) {
    const match = note.text.match(FOLLOWUP_REGEX);
    if (!match) continue;

    const rawTest = match[1].trim();
    const count = parseInt(match[2], 10);
    const unit = match[3].toLowerCase();

    // Calculate due date
    const noteDate = new Date(note.note_date);
    let daysToAdd = count * 7;
    if (unit.startsWith('month')) daysToAdd = count * 30;
    if (unit.startsWith('day')) daysToAdd = count;

    const dueDate = new Date(noteDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if test was completed on or after due date
    const hasCompleted = labResults.some(lr => {
      return (lr.test_name_normalized.includes(rawTest.toLowerCase()) || rawTest.toLowerCase().includes(lr.test_name_normalized)) &&
        lr.result_date >= dueDate;
    });

    if (!hasCompleted) {
      const issueType = 'MISSING_FOLLOWUP';
      const severity = thresholdsConfig.severity_defaults[issueType] || 'medium';

      const existingIssue = db.prepare(`
        SELECT id FROM continuity_issues
        WHERE patient_id = ? AND issue_type = ? AND before_ref = ?
      `).get(patientId, issueType, note.id);

      if (!existingIssue) {
        const summary = {
          recommended_test: rawTest,
          ordered_on: note.note_date,
          due_by: dueDate,
          note_quote: match[0],
          finding: `Note on ${note.note_date} recommends "${match[0]}". No subsequent test result was found in the available records.`
        };

        const issueId = uuidv4();
        db.prepare(`
          INSERT INTO continuity_issues (
            id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
            reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          issueId,
          patientId,
          issueType,
          severity,
          note.id,
          null,
          JSON.stringify(summary),
          'not_found',
          `No subsequent ${rawTest} was found in the available records after ${dueDate}`,
          null,
          'needs_patient_confirmation',
          now,
          now
        );

        createdIssues.push({ id: issueId, issueType, test: rawTest });
      }
    }
  }

  return createdIssues;
}

/**
 * Master execution entry point: runs all comparison rules, reason finding, and evidence chain verifications.
 * 
 * @param {string} patientId 
 * @returns {object} Execution summary
 */
export function run_continuity_engine(patientId) {
  if (!patientId) throw new Error('Patient ID is required to run continuity engine');

  const medIssues = compare_medications(patientId);
  const labIssues = compare_labs(patientId);
  const evidenceIssues = check_patient_evidence_chain(patientId);
  const followupIssues = check_followups(patientId);

  // Write audit log for the continuity run
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    'system:continuity_engine',
    'system',
    'CONTINUITY_RUN_COMPLETED',
    'patient',
    patientId,
    new Date().toISOString(),
    JSON.stringify({
      medIssuesCount: medIssues.length,
      labIssuesCount: labIssues.length,
      evidenceIssuesCount: evidenceIssues.length,
      followupIssuesCount: followupIssues.length
    })
  );

  return {
    success: true,
    patientId,
    totalNewIssues: medIssues.length + labIssues.length + evidenceIssues.length + followupIssues.length,
    medIssues,
    labIssues,
    evidenceIssues,
    followupIssues
  };
}
