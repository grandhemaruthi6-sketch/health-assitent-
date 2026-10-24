import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';

export class PatientKnowledgeService {
  /**
   * Upsert a structured knowledge entry for a patient
   */
  static upsertEntry(userId, { entryType, key, title, summary, details }) {
    if (!userId || !entryType || !key) return null;
    const normalizedKey = key.trim().toLowerCase().replace(/[\s\W]+/g, '_');
    const now = new Date().toISOString();

    const existing = db.prepare(`
      SELECT id, details_json FROM patient_knowledge_base
      WHERE user_id = ? AND entry_type = ? AND key = ?
    `).get(userId, entryType, normalizedKey);

    if (existing) {
      let mergedDetails = details;
      try {
        const prev = JSON.parse(existing.details_json);
        if (Array.isArray(prev.history) && details.latestReading) {
          const history = [...prev.history, details.latestReading].slice(-10);
          mergedDetails = { ...prev, ...details, history };
        }
      } catch {}

      db.prepare(`
        UPDATE patient_knowledge_base
        SET title = ?, summary = ?, details_json = ?, last_updated_at = ?
        WHERE id = ?
      `).run(title, summary, JSON.stringify(mergedDetails), now, existing.id);

      return existing.id;
    } else {
      const id = uuidv4();
      const initialDetails = details.latestReading && !details.history
        ? { ...details, history: [details.latestReading] }
        : details;

      db.prepare(`
        INSERT INTO patient_knowledge_base (
          id, user_id, entry_type, key, title, summary, details_json, last_updated_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, entryType, normalizedKey, title, summary, JSON.stringify(initialDetails), now, now);

      return id;
    }
  }

  /**
   * Automatically absorbs a newly analyzed medical report into the patient's knowledge base
   */
  static absorbReportIntoKnowledge(userId, { report, visit, hospitalName, physicianName, labResults = [] }) {
    if (!userId) return;

    const reportDate = report?.report_date || report?.reportDate || new Date().toISOString().split('T')[0];

    // 1. Absorb Hospital
    if (hospitalName) {
      this.upsertEntry(userId, {
        entryType: 'hospital',
        key: hospitalName,
        title: hospitalName,
        summary: `Visited on ${reportDate}`,
        details: { name: hospitalName, lastVisit: reportDate }
      });
    }

    // 2. Absorb Doctor
    if (physicianName) {
      this.upsertEntry(userId, {
        entryType: 'doctor',
        key: physicianName,
        title: physicianName,
        summary: `Consulted at ${hospitalName || 'Clinic'} on ${reportDate}`,
        details: { name: physicianName, hospital: hospitalName || '', lastConsulted: reportDate }
      });
    }

    // 3. Absorb Biomarkers & Longitudinal Trends
    for (const lr of labResults) {
      if (!lr.name) continue;
      const reading = {
        date: reportDate,
        value: lr.numericValue != null ? lr.numericValue : lr.rawValue,
        numericValue: lr.numericValue,
        unit: lr.unit || '',
        status: lr.status || 'NORMAL',
        rawRange: lr.referenceRange?.rawRange || ''
      };

      this.upsertEntry(userId, {
        entryType: 'biomarker_history',
        key: lr.name,
        title: lr.name,
        summary: `Latest: ${reading.value} ${reading.unit} (${reading.status}) on ${reportDate}`,
        details: {
          analyte: lr.name,
          category: lr.category || 'General',
          latestReading: reading
        }
      });
    }
  }

  /**
   * Retrieves comprehensive longitudinal profile for a patient
   */
  static getPatientKnowledgeProfile(userId) {
    if (!userId) return { biomarkers: [], doctors: [], hospitals: [], totalEntries: 0 };

    const entries = db.prepare(`
      SELECT entry_type, key, title, summary, details_json, last_updated_at
      FROM patient_knowledge_base
      WHERE user_id = ?
      ORDER BY last_updated_at DESC
    `).all(userId);

    const profile = {
      biomarkers: [],
      doctors: [],
      hospitals: [],
      conditions: [],
      totalEntries: entries.length
    };

    for (const e of entries) {
      let parsed = {};
      try { parsed = JSON.parse(e.details_json); } catch {}

      if (e.entry_type === 'biomarker_history') {
        profile.biomarkers.push({
          name: e.title,
          summary: e.summary,
          latest: parsed.latestReading || null,
          history: parsed.history || [],
          lastUpdated: e.last_updated_at
        });
      } else if (e.entry_type === 'doctor') {
        profile.doctors.push({ name: e.title, details: parsed, lastUpdated: e.last_updated_at });
      } else if (e.entry_type === 'hospital') {
        profile.hospitals.push({ name: e.title, details: parsed, lastUpdated: e.last_updated_at });
      } else if (e.entry_type === 'condition') {
        profile.conditions.push({ title: e.title, summary: e.summary, details: parsed });
      }
    }

    return profile;
  }

  /**
   * Search knowledge base for specific metric or past doctor/hospital
   */
  static queryKnowledge(userId, query) {
    if (!userId || !query) return [];
    const lower = query.toLowerCase().trim();

    const entries = db.prepare(`
      SELECT entry_type, key, title, summary, details_json, last_updated_at
      FROM patient_knowledge_base
      WHERE user_id = ? AND (key LIKE ? OR title LIKE ? OR summary LIKE ?)
      LIMIT 5
    `).all(userId, `%${lower}%`, `%${lower}%`, `%${lower}%`);

    return entries.map(e => {
      let details = {};
      try { details = JSON.parse(e.details_json); } catch {}
      return { type: e.entry_type, title: e.title, summary: e.summary, details };
    });
  }
}
