import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';

// Patterns identifying external modality and diagnostic report references in notes
const MODALITY_REFERENCE_PATTERNS = [
  { type: 'MRI', regex: /\b(?:based\s+on\s+|advised\s+|ordered\s+)?(MRI(?:\s+[\w\-]+){0,3}?(?:\s+(?:scan|report|findings|imaging|spine))?)\b/i },
  { type: 'CT', regex: /\b(?:based\s+on\s+|advised\s+|ordered\s+)?(CT(?:\s+[\w\-]+){0,3}?(?:\s+(?:scan|report|findings|imaging))?)\b/i },
  { type: 'XRAY', regex: /\b(?:based\s+on\s+|advised\s+|ordered\s+)?(X-?ray(?:\s+[\w\-]+){0,3}?(?:\s+(?:scan|report|findings|film))?)\b/i },
  { type: 'LAB', regex: /\b(?:based\s+on\s+|advised\s+|ordered\s+)?((?:biopsy|histopathology|culture|pcr|flow\s+cytometry)(?:\s+(?:report|results|findings))?)\b/i },
  { type: 'OTHER', regex: /\b(?:based\s+on\s+|advised\s+|ordered\s+)?((?:ultrasound|usg|echocardiogram|echo|doppler)(?:\s+(?:report|findings))?)\b/i }
];

/**
 * Checks all clinical notes for referenced diagnostics and validates the evidence chain against uploaded documents.
 * 
 * @param {string} patientId 
 * @returns {Array<object>} Created or updated evidence references & issues
 */
export function check_patient_evidence_chain(patientId) {
  if (!patientId) return [];

  const notes = db.prepare(`
    SELECT n.id, n.visit_id, n.document_id, n.text, n.note_date
    FROM clinical_notes n
    WHERE n.patient_id = ?
    ORDER BY n.note_date ASC
  `).all(patientId);

  const patientDocs = db.prepare(`
    SELECT d.id, d.visit_id, d.type, d.title, d.ocr_text, d.uploaded_at
    FROM documents d
    WHERE d.patient_id = ?
  `).all(patientId);

  const results = [];
  const now = new Date().toISOString();

  for (const note of notes) {
    const text = note.text;

    for (const { type, regex } of MODALITY_REFERENCE_PATTERNS) {
      const match = text.match(regex);
      if (!match) continue;

      const referencedText = match[0].trim();
      const refType = type;

      // Search for candidate document matching modality
      let matchedDoc = null;
      let isUncertain = false;

      for (const doc of patientDocs) {
        if (doc.id === note.document_id) continue; // Exclude the clinical note document itself
        const docText = (doc.ocr_text || '').toLowerCase();
        const docTitle = (doc.title || '').toLowerCase();
        const docType = (doc.type || '').toLowerCase();

        // Check exact imaging type match
        if (refType === 'MRI') {
          if (docType === 'imaging' && (docTitle.includes('mri') || docText.includes('mri') || docText.includes('magnetic resonance'))) {
            matchedDoc = doc;
            break;
          }
        } else if (refType === 'CT') {
          if (docType === 'imaging' && (docTitle.includes('ct') || docText.includes('computed tomography') || docText.includes('ct scan'))) {
            matchedDoc = doc;
            break;
          }
        } else if (refType === 'XRAY') {
          if (docType === 'imaging' && (docTitle.includes('x-ray') || docTitle.includes('xray') || docText.includes('radiograph') || docText.includes('x-ray'))) {
            matchedDoc = doc;
            break;
          }
        } else if (refType === 'LAB') {
          if (docType === 'lab' && (docTitle.includes('biopsy') || docText.includes('biopsy') || docText.includes('histopathology'))) {
            matchedDoc = doc;
            break;
          }
        } else {
          if (docText.includes(refType.toLowerCase()) || docTitle.includes(refType.toLowerCase())) {
            matchedDoc = doc;
            break;
          }
        }

        // Weak/partial match check: mentioned in raw OCR without confirmed document category
        if (docText.includes(refType.toLowerCase())) {
          isUncertain = true;
        }
      }

      let evidenceStatus = 'not_found';
      let confidence = 0.95;

      if (matchedDoc) {
        evidenceStatus = 'found';
        confidence = 0.98;
      } else if (isUncertain) {
        evidenceStatus = 'uncertain';
        confidence = 0.65;
      }

      // Check if evidence_reference already recorded for this note & reference text
      const existingRef = db.prepare(`
        SELECT id, status, matched_document_id
        FROM evidence_references
        WHERE patient_id = ? AND note_id = ? AND referenced_type = ?
      `).get(patientId, note.id, refType);

      let refId = existingRef?.id;

      if (!existingRef) {
        refId = uuidv4();
        db.prepare(`
          INSERT INTO evidence_references (
            id, note_id, patient_id, referenced_type, referenced_text, matched_document_id, status, confidence, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          refId,
          note.id,
          patientId,
          refType,
          referencedText,
          matchedDoc ? matchedDoc.id : null,
          evidenceStatus,
          confidence,
          now
        );
      } else {
        db.prepare(`
          UPDATE evidence_references
          SET matched_document_id = ?, status = ?, confidence = ?
          WHERE id = ?
        `).run(matchedDoc ? matchedDoc.id : null, evidenceStatus, confidence, existingRef.id);
      }

      // If status is not_found, emit a MISSING_EVIDENCE issue
      // Core Principle 2: "Document not found" never means test not done. Always use "not found in the available records".
      if (evidenceStatus === 'not_found') {
        const issueSummary = {
          referenced_modality: refType,
          referenced_quote: referencedText,
          clinical_note_id: note.id,
          note_date: note.note_date,
          finding: `Clinical note on ${note.note_date} references ${refType} findings.`,
          message: `Note references ${refType} findings. No ${refType} report was found in the available records.`
        };

        const existingIssue = db.prepare(`
          SELECT id, status FROM continuity_issues
          WHERE patient_id = ? AND issue_type = 'MISSING_EVIDENCE' AND before_ref = ?
        `).get(patientId, note.id);

        if (!existingIssue) {
          const issueId = uuidv4();
          db.prepare(`
            INSERT INTO continuity_issues (
              id, patient_id, issue_type, severity, before_ref, after_ref, summary_structured,
              reason_status, reason_text, reason_source_document_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            issueId,
            patientId,
            'MISSING_EVIDENCE',
            'high',
            note.id,
            null,
            JSON.stringify(issueSummary),
            'not_found',
            `${refType} report not found in the available records`,
            null,
            'needs_patient_confirmation',
            now,
            now
          );

          // Write audit log
          db.prepare(`
            INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            'system:evidence_chain',
            'system',
            'ISSUE_CREATED',
            'continuity_issue',
            issueId,
            now,
            JSON.stringify({ issue_type: 'MISSING_EVIDENCE', refType, noteDate: note.note_date })
          );

          results.push({ issueId, type: 'MISSING_EVIDENCE', refType });
        }
      }
    }
  }

  return results;
}
