import assert from 'node:assert';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db/database.js';
import { runMigrations } from '../db/migrations.js';
import { AuthService } from '../services/authService.js';
import { SecureStorageService } from '../services/secureStorageService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';

// Setup database migrations before running tests
runMigrations();

test('=== HEALTHCOPILOT PERSISTENCE, AUTH & STORAGE TEST SUITE ===', async (t) => {
  // Test Users
  const userAData = {
    email: `patient_alice_${Date.now()}@test.healthcopilot.ai`,
    name: 'Alice Johnson',
    password: 'SecurePassword123!',
    bloodGroup: 'O+',
    age: 32
  };

  const userBData = {
    email: `patient_bob_${Date.now()}@test.healthcopilot.ai`,
    name: 'Bob Smith',
    password: 'BobSecretPassword456!',
    bloodGroup: 'A-',
    age: 45
  };

  let userA, tokenA;
  let userB, tokenB;

  // --------------------------------------------------------------------------
  // 1. User Registration & Authentication
  // --------------------------------------------------------------------------
  await t.test('1. User Registration & JWT Issuance', async () => {
    const resA = await AuthService.register(userAData);
    assert.ok(resA.user.id, 'User A should receive a unique UUID');
    assert.strictEqual(resA.user.email, userAData.email.toLowerCase());
    assert.strictEqual(resA.user.bloodGroup, 'O+');
    assert.ok(resA.token, 'Registration should issue a valid JWT');

    userA = resA.user;
    tokenA = resA.token;

    const resB = await AuthService.register(userBData);
    userB = resB.user;
    tokenB = resB.token;

    // Verify duplicate registration rejection
    await assert.rejects(
      async () => AuthService.register(userAData),
      /already exists/,
      'Should reject duplicate email registration'
    );
  });

  await t.test('2. User Login & Credential Verification', async () => {
    const loginRes = await AuthService.login({
      email: userAData.email,
      password: userAData.password
    });

    assert.strictEqual(loginRes.user.id, userA.id);
    assert.ok(loginRes.token, 'Login should return a valid JWT');

    // Reject bad password
    await assert.rejects(
      async () => AuthService.login({ email: userAData.email, password: 'WrongPassword' }),
      /Invalid email or password/
    );
  });

  // --------------------------------------------------------------------------
  // 2. Genuine Empty State
  // --------------------------------------------------------------------------
  await t.test('3. Genuine Empty State: New user has zero visits/reports without fake data', () => {
    const timeline = MedicalRecordService.getUserTimeline(userA.id);
    assert.strictEqual(Array.isArray(timeline), true, 'Timeline must be an array');
    assert.strictEqual(timeline.length, 0, 'New user timeline must be strictly empty [] (no fake hospital visits)');

    const hospitals = MedicalRecordService.getUserHospitals(userA.id);
    assert.strictEqual(hospitals.length, 0, 'New user hospitals list must be strictly empty []');

    const reports = MedicalRecordService.getUserReports(userA.id);
    assert.strictEqual(reports.length, 0, 'New user reports list must be strictly empty []');
  });

  // --------------------------------------------------------------------------
  // 3. Hospital Creation & Management
  // --------------------------------------------------------------------------
  let hospitalA;
  await t.test('4. Hospital Creation with Department & Location', () => {
    hospitalA = MedicalRecordService.createOrSelectHospital(userA.id, {
      name: 'Apollo Health City',
      branch: 'Jubilee Hills',
      location: 'Hyderabad, India',
      department: 'Hematology & Internal Medicine'
    });

    assert.ok(hospitalA.id);
    assert.strictEqual(hospitalA.name, 'Apollo Health City');
    assert.strictEqual(hospitalA.location, 'Hyderabad, India');
    assert.strictEqual(hospitalA.user_id, userA.id);

    // Selecting existing hospital name should return same hospital (idempotent)
    const duplicateHospital = MedicalRecordService.createOrSelectHospital(userA.id, {
      name: 'apollo health city' // case insensitive check
    });
    assert.strictEqual(duplicateHospital.id, hospitalA.id);
  });

  // --------------------------------------------------------------------------
  // 4. Clinical Visit Date Separation from Upload Time
  // --------------------------------------------------------------------------
  let visitA;
  const clinicalVisitDate = '2024-03-15'; // Genuine past clinical date

  await t.test('5. Clinical Visit Date Separation from Ingestion Timestamp', () => {
    visitA = MedicalRecordService.createOrFindVisit(userA.id, {
      hospitalId: hospitalA.id,
      visitDate: clinicalVisitDate,
      physicianName: 'Dr. Sarah Smith, MD',
      department: 'Hematology',
      reasonForVisit: 'Annual routine health checkup'
    });

    assert.ok(visitA.id);
    assert.strictEqual(visitA.visit_date, '2024-03-15', 'Clinical visit date must preserve exact doctor visit date');
    assert.notStrictEqual(visitA.visit_date, visitA.created_at, 'Visit date must NOT be equal to system created_at timestamp');
    assert.ok(new Date(visitA.created_at).getTime() > new Date(clinicalVisitDate).getTime(), 'System created_at should be current time');
  });

  await t.test('6. Missing or Invalid Visit Date Rejection', () => {
    assert.throws(
      () => MedicalRecordService.createOrFindVisit(userA.id, { hospitalId: hospitalA.id, visitDate: 'invalid-date' }),
      /Invalid visit date format/,
      'Should reject non YYYY-MM-DD dates'
    );
  });

  // --------------------------------------------------------------------------
  // 5. Multiple Reports Attached to One Visit & Deduplication
  // --------------------------------------------------------------------------
  let report1, report2;
  const samplePdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const samplePngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89]);

  await t.test('7. Attach Multiple Reports to a Single Visit', async () => {
    // Report 1: Complete Blood Count
    report1 = await MedicalRecordService.attachReport({
      userId: userA.id,
      visitId: visitA.id,
      title: 'Complete Blood Count (CBC)',
      category: 'Lab Report',
      reportDate: '2024-03-15',
      fileBuffer: samplePdfHeader,
      fileName: 'cbc_panel_2024.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: {
        documentType: 'Lab Report',
        plainLanguageSummary: {
          overview: 'Complete Blood Count shows normal hemoglobin and platelet count.'
        }
      }
    });

    assert.ok(report1.id);
    assert.strictEqual(report1.visitId, visitA.id);
    assert.strictEqual(report1.reportDate, '2024-03-15');
    assert.ok(report1.signedDownloadUrl.includes('/api/reports/'));

    // Report 2: Chest X-Ray scan report attached to the SAME visit
    report2 = await MedicalRecordService.attachReport({
      userId: userA.id,
      visitId: visitA.id,
      title: 'Chest X-Ray PA View',
      category: 'Scan/Imaging Report',
      reportDate: '2024-03-15',
      fileBuffer: samplePngHeader,
      fileName: 'chest_xray.png',
      mimeType: 'image/png',
      aiAnalysis: {
        documentType: 'Scan/Imaging Report',
        plainLanguageSummary: {
          overview: 'Clear lung fields with no acute focal consolidation.'
        }
      }
    });

    assert.ok(report2.id);
    assert.strictEqual(report2.visitId, visitA.id, 'Both reports must link to the same visit');
    assert.notStrictEqual(report1.id, report2.id, 'Reports must have separate IDs');

    // Verify timeline returns the visit with 2 reports
    const timeline = MedicalRecordService.getUserTimeline(userA.id);
    assert.strictEqual(timeline.length, 1, 'Should have 1 visit in timeline');
    assert.strictEqual(timeline[0].reports.length, 2, 'Visit should contain 2 attached reports');
    assert.strictEqual(timeline[0].reportCount, 2);
  });

  await t.test('8. Idempotent Deduplication: Identical file upload does not create duplicate report', async () => {
    // Re-upload exact same samplePdfHeader to the same visit
    const duplicateReport = await MedicalRecordService.attachReport({
      userId: userA.id,
      visitId: visitA.id,
      title: 'Complete Blood Count (CBC) Duplicate',
      category: 'Lab Report',
      reportDate: '2024-03-15',
      fileBuffer: samplePdfHeader, // identical hash
      fileName: 'cbc_panel_duplicate.pdf',
      mimeType: 'application/pdf'
    });

    assert.strictEqual(duplicateReport.id, report1.id, 'Should return existing report record without creating duplicate');

    // Timeline count remains 2
    const timeline = MedicalRecordService.getUserTimeline(userA.id);
    assert.strictEqual(timeline[0].reports.length, 2, 'Should not add duplicate record to visit');
  });

  // --------------------------------------------------------------------------
  // 6. User-Level Authorization & Access Isolation
  // --------------------------------------------------------------------------
  await t.test('9. Authorization: User B cannot access User A reports', () => {
    // User B attempts to fetch User A's report by changing ID
    const unauthorizedReport = MedicalRecordService.getReportById(userB.id, report1.id);
    assert.strictEqual(unauthorizedReport, null, 'User B must not be able to read User A report');

    // User B attempts to attach a report to User A's visit
    assert.rejects(
      async () => MedicalRecordService.attachReport({
        userId: userB.id,
        visitId: visitA.id,
        title: 'Malicious Attachment',
        reportDate: '2024-03-15',
        fileBuffer: samplePdfHeader,
        fileName: 'hack.pdf',
        mimeType: 'application/pdf'
      }),
      /unauthorized/i,
      'User B must not be allowed to attach files to User A visit'
    );

    // User B attempts to delete User A's report
    assert.throws(
      () => MedicalRecordService.deleteReport(userB.id, report1.id),
      /unauthorized/i,
      'User B must not be allowed to delete User A report'
    );
  });

  // --------------------------------------------------------------------------
  // 7. Private Vault Storage Isolation & Signed URLs
  // --------------------------------------------------------------------------
  await t.test('10. Private Vault File Isolation & Path Traversal Prevention', () => {
    // File must exist in User A's isolated vault
    const fileBytes = SecureStorageService.readFile(userA.id, `${userA.id}/${report1.id}_cbc_panel_2024.pdf`);
    assert.strictEqual(fileBytes.length, samplePdfHeader.length);

    // Path traversal attempt should throw
    assert.throws(
      () => SecureStorageService.readFile(userA.id, `../${userB.id}/secret.pdf`),
      /Access Denied/i
    );

    // Cross-user directory read attempt should throw
    assert.throws(
      () => SecureStorageService.readFile(userB.id, `${userA.id}/${report1.id}_cbc_panel_2024.pdf`),
      /Access Denied/i
    );
  });

  await t.test('11. Short-Lived Signed URL Verification & Expiration', () => {
    // Generate valid token
    const token = SecureStorageService.generateSignedUrlToken(userA.id, report1.id, 900);
    const verified = SecureStorageService.verifySignedToken(token, userA.id, report1.id);
    assert.strictEqual(verified.sub, userA.id);
    assert.strictEqual(verified.reportId, report1.id);

    // Cross-user token verification fails
    assert.throws(
      () => SecureStorageService.verifySignedToken(token, userB.id, report1.id),
      /different user account/i
    );

    // Mismatched reportId fails
    assert.throws(
      () => SecureStorageService.verifySignedToken(token, userA.id, 'some-other-report-id'),
      /not valid for this report ID/i
    );

    // Expired token test (0-second TTL)
    const expiredToken = SecureStorageService.generateSignedUrlToken(userA.id, report1.id, -1);
    assert.throws(
      () => SecureStorageService.verifySignedToken(expiredToken, userA.id, report1.id),
      /jwt expired/i
    );
  });

  // --------------------------------------------------------------------------
  // 8. Processing Status Tracking
  // --------------------------------------------------------------------------
  await t.test('12. Track Processing Statuses & Safe Failure Details', async () => {
    const failedReport = await MedicalRecordService.attachReport({
      userId: userA.id,
      visitId: visitA.id,
      title: 'Corrupted Blood Work Scan',
      category: 'Lab Report',
      reportDate: '2024-03-15',
      fileBuffer: Buffer.from('%PDF-1.4\ncorrupted file bytes'),
      fileName: 'corrupt_report.pdf',
      mimeType: 'application/pdf',
      processingStatus: 'failed',
      failureCode: 'UNREADABLE_OCR',
      failureReason: 'Document scan contains severe noise and optical artifacts.'
    });

    assert.strictEqual(failedReport.processingStatus, 'failed');
    assert.strictEqual(failedReport.failureCode, 'UNREADABLE_OCR');
    assert.strictEqual(failedReport.failureReason, 'Document scan contains severe noise and optical artifacts.');
    // Ensure failure details do not leak secrets
    assert.ok(!failedReport.failureReason.includes('SECRET'));
    assert.ok(!failedReport.failureReason.includes('PASSWORD'));
  });

  // --------------------------------------------------------------------------
  // 9. Deletion & Cleanup
  // --------------------------------------------------------------------------
  await t.test('13. Report Deletion Cleans Up Database and Private Vault File', () => {
    const deleteRes = MedicalRecordService.deleteReport(userA.id, report2.id);
    assert.strictEqual(deleteRes.success, true);

    const deletedRecord = MedicalRecordService.getReportById(userA.id, report2.id);
    assert.strictEqual(deletedRecord, null, 'Deleted report should not exist in database');

    // Confirm file was deleted from vault
    assert.throws(
      () => SecureStorageService.readFile(userA.id, `${userA.id}/${report2.id}_chest_xray.png`),
      /not found/i,
      'Vault file should be deleted on record removal'
    );
  });

  console.log('\n[PASS] All Persistence, Auth, Storage, and Authorization tests passed successfully!\n');
});
