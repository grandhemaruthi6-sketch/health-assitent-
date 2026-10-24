import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { getOcrProvider } from '../services/ocr/ocrFactory.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { SecureStorageService } from '../services/secureStorageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'healthcopilot.db');
const db = new Database(dbPath);

async function syncReports() {
  console.log('[Sync] Starting re-synchronization of existing medical reports...');

  const reports = db.prepare(`
    SELECT id, user_id, title, category, report_date, file_name, mime_type, file_storage_path
    FROM medical_reports
  `).all();

  console.log(`[Sync] Found ${reports.length} report(s) in database.`);
  const ocrProvider = getOcrProvider('test-synthetic');

  for (const report of reports) {
    try {
      console.log(`[Sync] Processing report ID: ${report.id} (${report.file_name})...`);
      
      let fileBuffer = null;
      try {
        fileBuffer = SecureStorageService.readFile(report.user_id, report.file_storage_path);
      } catch (readErr) {
        console.warn(`[Sync] Could not read file from vault for ${report.id}:`, readErr.message);
        continue;
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        console.warn(`[Sync] Empty buffer for ${report.id}`);
        continue;
      }

      // 1. Run OCR
      const ocrResult = await ocrProvider.processDocument(fileBuffer, report.mime_type, {
        fileName: report.file_name,
        category: report.category
      });

      // 2. Run clinical pipeline
      const aiAnalysis = await processMedicalDocument({
        fileBuffer,
        mimeType: report.mime_type,
        ocrResult,
        overrideCategory: report.category,
        fileName: report.file_name
      });

      // 3. Update database
      const effectiveReportDate = aiAnalysis.metadata?.documentDate || report.report_date;
      const aiSummary = aiAnalysis.plainLanguageSummary?.overview || 'Processed clinical document successfully.';

      db.prepare(`
        UPDATE medical_reports
        SET ocr_result_json = ?,
            ai_analysis_json = ?,
            report_date = ?,
            ai_summary = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        JSON.stringify(ocrResult),
        JSON.stringify(aiAnalysis),
        effectiveReportDate,
        aiSummary,
        report.id
      );

      console.log(`[Sync] Successfully updated ${report.file_name} -> Date: ${effectiveReportDate}, Biomarkers: ${aiAnalysis.labResults?.length || 0}`);
    } catch (err) {
      console.error(`[Sync] Error processing report ${report.id}:`, err.message);
    }
  }

  console.log('[Sync] Re-synchronization complete.');
}

syncReports().then(() => {
  db.close();
  process.exit(0);
}).catch(err => {
  console.error('[Sync Fatal]', err);
  db.close();
  process.exit(1);
});
