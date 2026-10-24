import test from 'node:test';
import assert from 'node:assert';
import { runMigrations } from '../db/migrations.js';
import { db } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import {
  ConversationalVoiceService,
  GREETINGS,
  detectLanguage,
  checkEmergencyTriage
} from '../services/voice/conversationalVoiceService.js';

runMigrations();

test('=== HEALTHCOPILOT CONVERSATIONAL VOICE ASSISTANT SUITE ===', async (t) => {
  const timestamp = Date.now();
  let testUser, visit, cbcReport;

  await t.test('1. Setup User and Authentic Medical Records', async () => {
    const regRes = await AuthService.register({
      email: `voice.test.${timestamp}@healthcopilot.local`,
      password: 'VoiceStrongPassword123!',
      name: 'Ravi Teja'
    });
    testUser = regRes.user;

    const hospital = await MedicalRecordService.createOrSelectHospital(testUser.id, {
      name: 'Apollo Hospital Jubilee Hills',
      branch: 'Main Campus'
    });

    visit = await MedicalRecordService.createOrFindVisit(testUser.id, {
      hospitalId: hospital.id,
      visitDate: '2026-10-15',
      physicianName: 'Dr. Suresh Reddy'
    });

    // Create real report with verified findings
    cbcReport = await MedicalRecordService.attachReport({
      userId: testUser.id,
      visitId: visit.id,
      title: 'Complete Blood Picture (CBC)',
      category: 'Lab Report',
      reportDate: '2026-10-15',
      fileBuffer: Buffer.from('%PDF-1.4 sample content for voice test'),
      fileName: 'cbc_priya.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: {
        documentType: 'Lab Report',
        labResults: [
          {
            id: 'cbc-hb-1',
            name: 'Hemoglobin',
            rawValue: '17.1',
            numericValue: 17.1,
            unit: 'g/dL',
            referenceRange: { low: 14.0, high: 18.0, rawRange: '14 - 18' },
            status: 'NORMAL'
          },
          {
            id: 'cbc-wbc-1',
            name: 'WBC Count',
            rawValue: '10,040',
            numericValue: 10040,
            unit: '/mm3',
            referenceRange: { low: 4000, high: 10000, rawRange: '4,000 - 10,000' },
            status: 'HIGH'
          },
          {
            id: 'cbc-plt-1',
            name: 'Platelet Count',
            rawValue: '267,000',
            numericValue: 267000,
            unit: '/mm3',
            referenceRange: { low: 140000, high: 450000, rawRange: '140,000 - 450,000' },
            status: 'NORMAL'
          }
        ]
      }
    });

    assert.ok(cbcReport.id, 'Report attached for voice grounding');
  });

  await t.test('2. Exact Multilingual Initial Greetings', async () => {
    assert.strictEqual(
      GREETINGS.te,
      'నమస్కారం! నేను HealthCopilot అసిస్టెంట్ని. మీకు ఎలా సహాయపడగలను?',
      'Exact Telugu natural greeting matches requirements'
    );
    assert.strictEqual(
      GREETINGS.en,
      "Hello! I'm your HealthCopilot assistant. How can I help you today?",
      'Exact English natural greeting matches requirements'
    );
    assert.strictEqual(
      GREETINGS.hi,
      'नमस्ते! मैं आपका HealthCopilot असिस्टेंट हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
      'Exact Hindi natural greeting matches requirements'
    );
  });

  await t.test('3. Language Identification & Code-Switching Detection', async () => {
    assert.strictEqual(detectLanguage('నమస్కారం నా రిపోర్ట్ చూడండి'), 'te', 'Telugu script detected');
    assert.strictEqual(detectLanguage('नमस्ते मेरा रिपोर्ट समझाइए'), 'hi', 'Devanagari script detected');
    assert.strictEqual(detectLanguage('Explain my hemoglobin level'), 'en', 'English text detected');
    assert.strictEqual(detectLanguage('Naa report lo hemoglobin normal ga undha?'), 'te', 'Romanized Telugu code-switching detected');
    assert.strictEqual(detectLanguage('Mera WBC count kaisa hai?'), 'hi', 'Romanized Hindi code-switching detected');
  });

  await t.test('4. Emergency Triage for Potentially Urgent Symptoms', async () => {
    const chestPainResult = checkEmergencyTriage('I have sudden severe chest pain and cannot breathe');
    assert.ok(chestPainResult, 'Detects emergency red flag');
    assert.ok(chestPainResult.guidance.en.includes('108 in India or 911'), 'Provides emergency helpline guidance in English');
    assert.ok(chestPainResult.guidance.te.includes('108'), 'Provides emergency helpline guidance in Telugu');

    const teluguEmergency = checkEmergencyTriage('నాకు తీవ్రమైన ఛాతీ నొప్పి వస్తోంది');
    assert.ok(teluguEmergency, 'Detects emergency in Telugu');
  });

  await t.test('5. Grounded Multilingual Question Answering (Telugu, Hindi, English)', async () => {
    // A. Telugu query about Hemoglobin
    const teResponse = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'నా హిమోగ్లోబిన్ నార్మల్ గా ఉందా?',
      language: 'te',
      reportId: cbcReport.id
    });
    assert.strictEqual(teResponse.language, 'te');
    assert.ok(teResponse.answer.includes('17.1 g/dL'), 'Uses authentic 17.1 g/dL in Telugu response');
    assert.ok(teResponse.answer.includes('14 - 18'), 'Uses authentic 14 - 18 range in Telugu response');
    assert.ok(teResponse.answer.includes('సాధారణ పరిధిలోనే ఉంది'), 'Telugu indicates normal status');
    assert.ok(teResponse.medicalDisclaimer.includes('సమాచార ప్రయోజనాల కోసం మాత్రమే'), 'Telugu disclaimer attached');

    // B. English query about elevated WBC
    const enResponse = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'Why is my WBC count slightly high?',
      language: 'en',
      reportId: cbcReport.id
    });
    assert.strictEqual(enResponse.language, 'en');
    assert.ok(enResponse.answer.includes('10,040'), 'Uses authentic 10,040 WBC count');
    assert.ok(enResponse.answer.includes('4,000 - 10,000'), 'Uses authentic 4,000 - 10,000 reference interval');
    assert.ok(enResponse.answer.includes('slightly elevated'), 'Correct clinical assessment without alarmism');
    assert.ok(enResponse.medicalDisclaimer.includes('educational health summaries'), 'English disclaimer attached');

    // C. Hindi query about Platelets
    const hiResponse = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'मेरी प्लेटलेट संख्या कैसी है?',
      language: 'hi',
      reportId: cbcReport.id
    });
    assert.strictEqual(hiResponse.language, 'hi');
    assert.ok(hiResponse.answer.includes('267,000'), 'Uses authentic 267,000 platelet count in Hindi');
    assert.ok(hiResponse.medicalDisclaimer.includes('केवल सामान्य स्वास्थ्य जानकारी'), 'Hindi disclaimer attached');
  });

  await t.test('6. Multi-Turn Conversation History Retention', async () => {
    const history = [
      { role: 'user', content: 'What is my WBC count?' },
      { role: 'assistant', content: 'Your WBC count is 10,040 /mm³, which is slightly elevated.' }
    ];

    const followUp = await ConversationalVoiceService.processConversationTurn({
      userId: testUser.id,
      message: 'What questions should I ask my doctor about this?',
      language: 'en',
      history,
      reportId: cbcReport.id
    });

    assert.ok(followUp.success, 'Follow-up turn succeeds');
    assert.ok(followUp.followUps.length > 0, 'Generates relevant next-step follow-ups');
  });

  await t.test('7. Voice Configuration & Cloud TTS Status', async () => {
    const config = ConversationalVoiceService.getVoiceConfig();
    assert.strictEqual(config.supportedLanguages.length, 3, 'Supports te, en, hi');
    assert.strictEqual(config.greetings.te, GREETINGS.te);
    assert.strictEqual(config.speechSynthesis.isCloudTtsConfigured, false, 'Gracefully flags cloud TTS unconfigured when keys absent');
    assert.strictEqual(config.speechSynthesis.provider, 'browser-natural', 'Defaults to browser natural synthesis');
    assert.ok(config.speechSynthesis.preferredVoices.te.length > 0, 'Specifies natural preferred Telugu voices');
  });

  // Teardown
  try {
    await MedicalRecordService.deleteReport(testUser.id, cbcReport.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUser.id);
  } catch {}
});
