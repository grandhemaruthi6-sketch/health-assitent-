import { db } from './database.js';

export const MIGRATIONS = [
  {
    version: 1,
    name: '001_initial_medical_schema',
    up: (database) => {
      // 1. Users Table
      database.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          password_hash TEXT NOT NULL,
          blood_group TEXT,
          age INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // 2. Hospitals Table (User-registered or selected clinics, branches, departments)
      database.exec(`
        CREATE TABLE IF NOT EXISTS hospitals (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          branch TEXT,
          location TEXT,
          department TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_hospitals_user ON hospitals(user_id, name);
      `);

      // 3. Hospital Visits Table (Separates visit_date from uploaded_at)
      database.exec(`
        CREATE TABLE IF NOT EXISTS hospital_visits (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          hospital_id TEXT NOT NULL,
          visit_date TEXT NOT NULL, -- Format YYYY-MM-DD: Distinct clinical date!
          physician_name TEXT,
          department TEXT,
          reason_for_visit TEXT,
          idempotency_key TEXT,
          created_at TEXT NOT NULL, -- Ingestion/Record creation timestamp
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
          UNIQUE(user_id, idempotency_key)
        );
        CREATE INDEX IF NOT EXISTS idx_visits_user_date ON hospital_visits(user_id, visit_date DESC);
        CREATE INDEX IF NOT EXISTS idx_visits_hospital ON hospital_visits(hospital_id);
      `);

      // 4. Medical Reports Table (Multiple reports per visit, secure files, OCR & AI state)
      database.exec(`
        CREATE TABLE IF NOT EXISTS medical_reports (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL, -- Lab Report, Discharge Summary, Prescription, etc.
          report_date TEXT NOT NULL, -- Actual clinical date printed on the report
          uploaded_at TEXT NOT NULL, -- Exact timestamp file was uploaded
          file_storage_path TEXT NOT NULL, -- Path in private secure storage
          file_name TEXT NOT NULL,
          file_size_bytes INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          file_hash_sha256 TEXT NOT NULL, -- For duplicate detection
          idempotency_key TEXT,
          processing_status TEXT NOT NULL CHECK(processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
          failure_code TEXT,
          failure_reason TEXT,
          ocr_result_json TEXT, -- Structured OCR layout from Phase 2
          ai_analysis_json TEXT, -- Validated medical schema extraction from Phase 3
          ai_summary TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES hospital_visits(id) ON DELETE CASCADE,
          UNIQUE(user_id, idempotency_key)
        );
        CREATE INDEX IF NOT EXISTS idx_reports_user_date ON medical_reports(user_id, report_date DESC);
        CREATE INDEX IF NOT EXISTS idx_reports_visit ON medical_reports(visit_id);
        CREATE INDEX IF NOT EXISTS idx_reports_hash ON medical_reports(user_id, file_hash_sha256);
      `);
    }
  },
  {
    version: 2,
    name: '002_add_report_health_summaries',
    up: (database) => {
      database.exec(`
        CREATE TABLE IF NOT EXISTS report_health_summaries (
          id TEXT PRIMARY KEY,
          report_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          language TEXT NOT NULL CHECK(language IN ('en', 'te', 'hi')),
          summary_json TEXT NOT NULL,
          data_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (report_id) REFERENCES medical_reports(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(report_id, language)
        );
        CREATE INDEX IF NOT EXISTS idx_summaries_report_lang ON report_health_summaries(report_id, language);
        CREATE INDEX IF NOT EXISTS idx_summaries_user ON report_health_summaries(user_id);
      `);
    }
  },
  {
    version: 3,
    name: '003_add_patient_knowledge_base',
    up: (database) => {
      database.exec(`
        CREATE TABLE IF NOT EXISTS patient_knowledge_base (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          entry_type TEXT NOT NULL, -- biomarker_history, doctor, hospital, condition, medication, visit_context
          key TEXT NOT NULL,        -- normalized identifier: hemoglobin, dr_suresh_reddy, etc.
          title TEXT NOT NULL,
          summary TEXT,
          details_json TEXT NOT NULL,
          last_updated_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, entry_type, key)
        );
        CREATE INDEX IF NOT EXISTS idx_pkb_user_type ON patient_knowledge_base(user_id, entry_type);
        CREATE INDEX IF NOT EXISTS idx_pkb_user_key ON patient_knowledge_base(user_id, key);
      `);
    }
  },
  {
    version: 4,
    name: '004_add_continuity_engine_tables',
    up: (database) => {
      database.exec(`
        -- 1. Patients Table
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          email TEXT,
          age INTEGER,
          gender TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);

        -- 2. Visits Table
        CREATE TABLE IF NOT EXISTS visits (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          hospital_id TEXT,
          visit_date TEXT NOT NULL,
          doctor_name TEXT,
          department TEXT,
          reason_for_visit TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON visits(patient_id, visit_date);

        -- 3. Documents Table
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          visit_id TEXT,
          type TEXT NOT NULL CHECK(type IN ('prescription','lab','note','imaging','other')),
          title TEXT,
          file_url TEXT NOT NULL,
          ocr_text TEXT NOT NULL,
          uploaded_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_documents_patient ON documents(patient_id);
        CREATE INDEX IF NOT EXISTS idx_documents_visit ON documents(visit_id);

        -- 4. Medications Table
        CREATE TABLE IF NOT EXISTS medications (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          document_id TEXT,
          name_raw TEXT NOT NULL,
          name_normalized TEXT NOT NULL,
          dose_value REAL,
          dose_unit TEXT,
          frequency_normalized TEXT,
          frequency_raw TEXT,
          start_date TEXT,
          extraction_confidence REAL DEFAULT 1.0,
          needs_confirmation INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_meds_patient_norm ON medications(patient_id, name_normalized);
        CREATE INDEX IF NOT EXISTS idx_meds_visit ON medications(visit_id);

        -- 5. Lab Results Table
        CREATE TABLE IF NOT EXISTS lab_results (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          document_id TEXT,
          test_name_raw TEXT NOT NULL,
          test_name_normalized TEXT NOT NULL,
          value_num REAL,
          unit TEXT,
          ref_range TEXT,
          result_date TEXT NOT NULL,
          extraction_confidence REAL DEFAULT 1.0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_labs_patient_date ON lab_results(patient_id, test_name_normalized, result_date);

        -- 6. Clinical Notes Table
        CREATE TABLE IF NOT EXISTS clinical_notes (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          document_id TEXT,
          text TEXT NOT NULL,
          note_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_notes_patient_date ON clinical_notes(patient_id, note_date);

        -- 7. Evidence References Table
        CREATE TABLE IF NOT EXISTS evidence_references (
          id TEXT PRIMARY KEY,
          note_id TEXT,
          patient_id TEXT NOT NULL,
          referenced_type TEXT NOT NULL CHECK(referenced_type IN ('MRI','CT','XRAY','LAB','OTHER')),
          referenced_text TEXT NOT NULL,
          matched_document_id TEXT,
          status TEXT NOT NULL CHECK(status IN ('found','not_found','uncertain')),
          confidence REAL DEFAULT 1.0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_ev_refs_patient ON evidence_references(patient_id);

        -- 8. Decision Records Table
        CREATE TABLE IF NOT EXISTS decision_records (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          visit_id TEXT NOT NULL,
          finding TEXT NOT NULL,
          decision TEXT NOT NULL,
          documented_reason TEXT,
          reason_source_document_id TEXT,
          reason_source_quote TEXT,
          evidence_document_ids TEXT,
          source TEXT DEFAULT 'clinician documented',
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_decisions_patient ON decision_records(patient_id);

        -- 9. Continuity Issues Table
        CREATE TABLE IF NOT EXISTS continuity_issues (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          issue_type TEXT NOT NULL CHECK(issue_type IN ('MED_DOSE_CHANGE','MED_FREQ_CHANGE','MED_ADDED','MED_STOPPED','LAB_SIGNIFICANT_CHANGE','MISSING_EVIDENCE','MISSING_FOLLOWUP')),
          severity TEXT NOT NULL CHECK(severity IN ('low','medium','high')),
          before_ref TEXT,
          after_ref TEXT,
          summary_structured TEXT NOT NULL,
          reason_status TEXT NOT NULL CHECK(reason_status IN ('documented','not_found','uncertain')),
          reason_text TEXT,
          reason_source_document_id TEXT,
          status TEXT NOT NULL CHECK(status IN ('detected','needs_patient_confirmation','pending_review','resolved','dismissed')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_issues_patient_status ON continuity_issues(patient_id, status);
        CREATE INDEX IF NOT EXISTS idx_issues_type ON continuity_issues(issue_type);

        -- 10. Issue Reviews Table
        CREATE TABLE IF NOT EXISTS issue_reviews (
          id TEXT PRIMARY KEY,
          issue_id TEXT NOT NULL,
          reviewer_id TEXT NOT NULL,
          reviewer_role TEXT NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('confirmed_intentional','explained','needs_followup','dismissed')),
          explanation_text TEXT NOT NULL,
          evidence_document_ids TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (issue_id) REFERENCES continuity_issues(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_issue ON issue_reviews(issue_id);

        -- 11. Audit Log Table
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          actor_id TEXT NOT NULL,
          actor_role TEXT NOT NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);

        -- 12. Doctor Access Grants Table
        CREATE TABLE IF NOT EXISTS doctor_access_grants (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          doctor_id TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          attempts INTEGER DEFAULT 0,
          expires_at TEXT NOT NULL,
          approved_at TEXT,
          revoked_at TEXT,
          scope TEXT DEFAULT 'continuity_review',
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_grants_patient ON doctor_access_grants(patient_id);
        CREATE INDEX IF NOT EXISTS idx_grants_code ON doctor_access_grants(code_hash);
      `);
    }
  },
  {
    version: 5,
    name: '005_add_missing_knowledge_and_summary_version',
    up: (database) => {
      // Add version column to report_health_summaries if not already present
      const summaryCols = database.prepare("PRAGMA table_info(report_health_summaries)").all().map(c => c.name);
      if (!summaryCols.includes('version')) {
        database.exec(`ALTER TABLE report_health_summaries ADD COLUMN version INTEGER DEFAULT 1;`);
      }

      // Create missing_knowledge table to log uncataloged tests
      database.exec(`
        CREATE TABLE IF NOT EXISTS missing_knowledge (
          id TEXT PRIMARY KEY,
          test_name TEXT NOT NULL,
          raw_value TEXT,
          reference_range TEXT,
          report_id TEXT,
          user_id TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_missing_knowledge_name ON missing_knowledge(test_name);
      `);
    }
  }
];

export function runMigrations(database = db) {
  // Ensure schema_migrations table exists
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = database.prepare('SELECT version FROM schema_migrations').all();
  const appliedVersions = new Set(appliedRows.map(r => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[Database Migration] Applying migration ${migration.version}: ${migration.name}`);
      const tx = database.transaction(() => {
        migration.up(database);
        database.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
          .run(migration.version, migration.name, new Date().toISOString());
      });
      tx();
      console.log(`[Database Migration] Migration ${migration.version} applied successfully.`);
    }
  }
}
