import test from 'node:test';
import assert from 'node:assert';
import { runMigrations } from '../db/migrations.js';
import { db } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import {
  ConversationalVoiceService,
  checkUploadIntent,
  generateSimpleHumanBreakdown
} from '../services/voice/conversationalVoiceService.js';
import { PatientKnowledgeService } from '../services/knowledge/patientKnowledgeService.js';

runMigrations();

test('=== HEALTHCOPILOT VOICE UPLOAD WORKFLOW & PATIENT KNOWLEDGE BASE ===', async (t) => {
  const timestamp = Date.now();
  let testUser, visit, report;

  await t.test('1. Setup User and Knowledge Base Session', async () => {
    const regRes = await AuthService.register({
      email: `knowledge.voice.${timestamp}@healthcopilot.local`,
      password: 'StrongVoicePassword123!',
      name: 'Ananya Sharma'
    });
    testUser = regRes.user;

    const hospital = await MedicalRecordService.createOrSelectHospital(testUser.id, {
      name: 'Yashoda Hospitals Somajiguda',
      branch: 'Main Branch'
    });

    visit = await MedicalRecordService.createOrFindVisit(testUser.id, {
      hospitalId: hospital.id,
      visitDate: '2026-10-20',
      physicianName: 'Dr. Sarah Jenkins'
    });

    report = await MedicalRecordService.attachReport({
      userId: testUser.id,
      visitId: visit.id,
      title: 'Complete Blood Picture',
      category: 'Lab Report',
      reportDate: '2026-10-20',
      fileBuffer: Buffer.from('%PDF-1.4 sample content for knowledge test'),
      fileName: 'cbc_ananya.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: {
        documentType: 'Lab Report',
        labResults: [
          {
            name: 'Hemoglobin',
            rawValue: '14.5',
            numericValue: 14.5,
            unit: 'g/dL',
            status: 'NORMAL',
            referenceRange: { low: 12.0, high: 16.0, rawRange: '12.0 - 16.0' }
          },
          {
            name: 'WBC Count',
            rawValue: '11,200',
            numericValue: 11200,
            unit: '/mm3',
            status: 'HIGH',
            referenceRange: { low: 4000, high: 10000, rawRange: '4,000 - 10,000' }
          },
          {
            name: 'Platelet Count',
            rawValue: '250,000',
            numericValue: 250000,
            unit: '/mm3',
            status: 'NORMAL',
            referenceRange: { low: 150000, high: 450000, rawRange: '150,000 - 450,000' }
          }
        ]
      }
    });

    assert.ok(testUser.id, 'Test user registered');
    assert.ok(report.id, 'Report attached');
  });

  await t.test('2. Voice Upload Intent Detection (English, Telugu, Hindi)', async () => {
    // English
    assert.strictEqual(checkUploadIntent('I want to upload a document'), true);
    assert.strictEqual(checkUploadIntent('Can I scan my lab report?'), true);

    // Telugu
    assert.strictEqual(checkUploadIntent('నా రిపోర్ట్ అప్‌లోడ్ చేయాలి'), true);
    assert.strictEqual(checkUploadIntent('డాక్యుమెంట్ స్కాన్ చేయాలి'), true);

    // Hindi
    assert.strictEqual(checkUploadIntent('दस्तावेज़ अपलोड करना है'), true);
    assert.strictEqual(checkUploadIntent('मेरी रिपोर्ट स्कैन करें'), true);

    // Turn processing verification
    const enTurn = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'I want to upload my lab report',
      language: 'en'
    });
    assert.strictEqual(enTurn.action, 'PROMPT_UPLOAD');
    assert.ok(enTurn.followUps.length >= 2, 'Followups offer camera and file upload');

    const teTurn = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'నా ల్యాబ్ రిపోర్ట్ అప్‌లోడ్ చేయాలి',
      language: 'te'
    });
    assert.strictEqual(teTurn.action, 'PROMPT_UPLOAD');
    assert.ok(teTurn.answer.includes('స్కాన్') || teTurn.answer.includes('అప్‌లోడ్'));
  });

  await t.test('3. Post-Upload Conversational Interview Step Progression', async () => {
    // Step 1: CONFIRM_DATE
    const step1 = await ConversationalVoiceService.processPostUploadInterviewStep({
      userId: testUser.id,
      visitId: visit.id,
      reportId: report.id,
      step: 'CONFIRM_DATE',
      answer: '2026-10-20',
      language: 'en'
    });
    assert.strictEqual(step1.step, 'CONFIRM_HOSPITAL');
    assert.ok(step1.prompt.includes('hospital') || step1.prompt.includes('laboratory'));

    // Step 2: CONFIRM_HOSPITAL
    const step2 = await ConversationalVoiceService.processPostUploadInterviewStep({
      userId: testUser.id,
      visitId: visit.id,
      reportId: report.id,
      step: 'CONFIRM_HOSPITAL',
      answer: 'Yashoda Hospitals',
      language: 'te'
    });
    assert.strictEqual(step2.step, 'CONFIRM_DOCTOR');
    assert.ok(step2.prompt.includes('డాక్టర్'));

    // Step 3: CONFIRM_DOCTOR
    const step3 = await ConversationalVoiceService.processPostUploadInterviewStep({
      userId: testUser.id,
      visitId: visit.id,
      reportId: report.id,
      step: 'CONFIRM_DOCTOR',
      answer: 'Dr. Sarah Jenkins',
      language: 'hi'
    });
    assert.strictEqual(step3.step, 'CONFIRM_CONTEXT');
    assert.ok(step3.prompt.includes('लक्षण') || step3.prompt.includes('फास्टिंग'));

    // Step 4: CONFIRM_CONTEXT
    const step4 = await ConversationalVoiceService.processPostUploadInterviewStep({
      userId: testUser.id,
      visitId: visit.id,
      reportId: report.id,
      step: 'CONFIRM_CONTEXT',
      answer: 'Routine wellness check, fasting 10 hours',
      language: 'en'
    });
    assert.strictEqual(step4.completed, true);
    assert.strictEqual(step4.step, 'COMPLETED');
  });

  await t.test('4. Simple Human Breakdown with Everyday Analogies (Beginner Friendly)', async () => {
    const labResults = [
      { name: 'Hemoglobin', numericValue: 14.5, unit: 'g/dL', status: 'NORMAL' },
      { name: 'WBC Count', numericValue: 11200, unit: '/mm3', status: 'HIGH' },
      { name: 'Platelet Count', numericValue: 250000, unit: '/mm3', status: 'NORMAL' }
    ];

    const breakdownEn = generateSimpleHumanBreakdown({ labResults, language: 'en' });
    assert.ok(breakdownEn.normalFindings.length >= 2, 'Hemoglobin & Platelets listed as normal');
    assert.ok(breakdownEn.watchFindings.length >= 1, 'WBC listed in watch list');
    assert.ok(breakdownEn.analogySummary.includes('trucks') || breakdownEn.analogySummary.includes('soldiers') || breakdownEn.analogySummary.includes('bandage'), 'Contains relatable analogy');
    assert.ok(breakdownEn.doctorQuestions.length >= 1, 'Generates practical doctor questions');

    const breakdownTe = generateSimpleHumanBreakdown({ labResults, language: 'te' });
    assert.ok(breakdownTe.analogySummary.includes('డెలివరీ') || breakdownTe.analogySummary.includes('సైనికుల') || breakdownTe.analogySummary.includes('బ్యాండేజ్'), 'Telugu analogy present');

    const breakdownHi = generateSimpleHumanBreakdown({ labResults, language: 'hi' });
    assert.ok(breakdownHi.analogySummary.includes('वैन') || breakdownHi.analogySummary.includes('सेना') || breakdownHi.analogySummary.includes('पट्टी'), 'Hindi analogy present');
  });

  await t.test('5. Patient Knowledge Base Storage & Longitudinal Recall', async () => {
    // Absorb report into knowledge base
    PatientKnowledgeService.absorbReportIntoKnowledge(testUser.id, {
      report,
      visit,
      hospitalName: 'Yashoda Hospitals Somajiguda',
      physicianName: 'Dr. Sarah Jenkins',
      labResults: [
        { name: 'Hemoglobin', numericValue: 14.5, unit: 'g/dL', status: 'NORMAL' },
        { name: 'Platelet Count', numericValue: 250000, unit: '/mm3', status: 'NORMAL' }
      ]
    });

    const profile = PatientKnowledgeService.getPatientKnowledgeProfile(testUser.id);
    assert.ok(profile.totalEntries >= 2, 'Knowledge entries stored');
    assert.ok(profile.doctors.some(d => d.name === 'Dr. Sarah Jenkins'), 'Doctor remembered');
    assert.ok(profile.hospitals.some(h => h.name.includes('Yashoda')), 'Hospital remembered');
    assert.ok(profile.biomarkers.some(b => b.name === 'Hemoglobin'), 'Hemoglobin trend tracked');

    // Query Assistant about past doctor
    const docQuery = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'Who is my consulting doctor?',
      language: 'en'
    });
    assert.ok(docQuery.answer.includes('Dr. Sarah Jenkins'), 'Assistant recalls doctor from memory');

    const teDocQuery = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'నా డాక్టర్ ఎవరు?',
      language: 'te'
    });
    assert.ok(teDocQuery.answer.includes('Dr. Sarah Jenkins'), 'Telugu assistant recalls doctor');
  });
});
