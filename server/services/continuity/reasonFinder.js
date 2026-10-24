import { db } from '../../db/database.js';

// Deterministic clinical reason phrasing regex
const REASON_EXPRESSIONS = [
  /\b(?:reduced|reducing|decreased|decreasing|tapered|tapering|lowered|lowering)\s*(?:due to|because of|secondary to|owing to|as|following|for)?\s+([^.;\n]+)/i,
  /\b(?:stopped|stopping|discontinued|discontinuing|withheld|held|ceased)\s*(?:due to|because of|secondary to|owing to|as|for)?\s+([^.;\n]+)/i,
  /\b(?:increased|increasing|escalated|escalating|stepped up|stepping up|doubled|raised|raising)\s*(?:[A-Za-z0-9\s]+?\s+)?(?:due to|because of|secondary to|as|for)\s+([^.;\n]+)/i,
  /\b(?:changed|switched|modified|adjusted|titrated)\s+(?:due to|because of|secondary to|as|based on)\s+([^.;\n]+)/i,
  /\b(?:dose\s+adjusted|treatment\s+modified)\s+(?:for|due to|because of|secondary to|based on)\s+([^.;\n]+)/i,
  /\b(?:uncontrolled|elevated|high|persistent|poorly\s+controlled)\s+(?:sugars|diabetes|glycemia|bp|blood\s+pressure|hypertension|pain|infection|symptoms)\b/i,
  /\b(?:side\s+effect|intolerance|adverse\s+reaction|allergy|rash|gastric\s+distress)\s+(?:from|to|with)\s+([^.;\n]+)/i,
  /\b(?:renal\s+adjustment|eGFR\s+drop|creatinine\s+elevation|hypoglycemia)\b/i
];

/**
 * Searches clinical notes and decision records between visits for explicit documented reasons.
 * 
 * @param {string} patientId 
 * @param {object} params
 * @param {string} params.itemName - Normalized med name or lab name
 * @param {string} params.rawName - Raw input name
 * @param {string} params.beforeDate - Start date of the continuity interval
 * @param {string} params.afterDate - End date of the continuity interval
 * @returns {{ reason_status: 'documented'|'not_found'|'uncertain', reason_text: string, reason_source_document_id: string|null, reason_source_quote: string|null }}
 */
export function find_continuity_reason(patientId, { itemName, rawName, beforeDate, afterDate }) {
  if (!patientId || !afterDate) {
    return {
      reason_status: 'not_found',
      reason_text: 'Reason not found in the available records',
      reason_source_document_id: null,
      reason_source_quote: null
    };
  }

  // 1. Check existing Decision Records for this patient around this date interval
  const decisionRow = db.prepare(`
    SELECT id, documented_reason, reason_source_document_id, reason_source_quote, finding, decision
    FROM decision_records
    WHERE patient_id = ?
      AND (
        lower(finding) LIKE ? OR lower(decision) LIKE ? OR lower(documented_reason) LIKE ?
      )
    ORDER BY created_at DESC
    LIMIT 1
  `).get(
    patientId,
    `%${itemName.toLowerCase()}%`,
    `%${itemName.toLowerCase()}%`,
    `%${itemName.toLowerCase()}%`
  );

  if (decisionRow && decisionRow.documented_reason) {
    return {
      reason_status: 'documented',
      reason_text: decisionRow.documented_reason,
      reason_source_document_id: decisionRow.reason_source_document_id || null,
      reason_source_quote: decisionRow.reason_source_quote || decisionRow.documented_reason
    };
  }

  // 2. Search Clinical Notes strictly after previous visit up to current visit date
  const notes = db.prepare(`
    SELECT id, document_id, text, note_date
    FROM clinical_notes
    WHERE patient_id = ?
      AND note_date > ?
      AND note_date <= ?
    ORDER BY note_date DESC
  `).all(patientId, beforeDate || '1970-01-01', afterDate);

  const targetTokens = [itemName.toLowerCase(), (rawName || '').toLowerCase()].filter(Boolean);

  let bestMatch = null;
  let ambiguousMatch = null;

  for (const note of notes) {
    const sentences = note.text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const mentionsTarget = targetTokens.some(tok => lowerSentence.includes(tok));
      const hasReasonKeyword = REASON_EXPRESSIONS.some(regex => regex.test(sentence));

      if (mentionsTarget && hasReasonKeyword) {
        bestMatch = {
          quote: sentence,
          documentId: note.document_id || note.id
        };
        break;
      } else if (hasReasonKeyword && !mentionsTarget) {
        // Reason keyword exists but does not explicitly name this specific drug/test
        if (!ambiguousMatch) {
          ambiguousMatch = {
            quote: sentence,
            documentId: note.document_id || note.id
          };
        }
      }
    }

    if (bestMatch) break;
  }

  if (bestMatch) {
    return {
      reason_status: 'documented',
      reason_text: bestMatch.quote,
      reason_source_document_id: bestMatch.documentId,
      reason_source_quote: bestMatch.quote
    };
  }

  if (ambiguousMatch) {
    return {
      reason_status: 'uncertain',
      reason_text: `Possible reason mentioned: "${ambiguousMatch.quote}" (unclear whether it applies to ${rawName || itemName})`,
      reason_source_document_id: ambiguousMatch.documentId,
      reason_source_quote: ambiguousMatch.quote
    };
  }

  // Mandatory wording per core principles:
  // "Reason not found" never means doctor error. Always use the wording "not found in the available records".
  return {
    reason_status: 'not_found',
    reason_text: 'Reason not found in the available records',
    reason_source_document_id: null,
    reason_source_quote: null
  };
}
