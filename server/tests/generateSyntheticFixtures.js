import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

export async function generateFixtures() {
  console.log('[Fixture Generator] Generating synthetic de-identified test fixtures...');

  // 1. Generate 2-Page Synthetic Laboratory Multi-Page PDF Report
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // --- Page 1: CBC & Patient Details ---
  const page1 = pdfDoc.addPage([595, 842]); // A4
  page1.drawText('APOLLO MULTISPECIALITY HOSPITAL', { x: 50, y: 790, size: 16, font: fontBold, color: rgb(0, 0.4, 0.38) });
  page1.drawText('CLINICAL PATHOLOGY & DIAGNOSTIC SERVICES', { x: 50, y: 770, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText('Page 1 of 2 — Complete Blood Count (CBC)', { x: 350, y: 790, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  page1.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page1.drawText('Patient Name: De-Identified Subject A-102', { x: 50, y: 735, size: 10, font: fontRegular });
  page1.drawText('Age / Gender: 32 / F', { x: 300, y: 735, size: 10, font: fontRegular });
  page1.drawText('Referred By: Dr. Sarah Jenkins, MD', { x: 50, y: 715, size: 10, font: fontRegular });
  page1.drawText('Sample Date: 2026-10-15 08:30', { x: 300, y: 715, size: 10, font: fontRegular });

  page1.drawLine({ start: { x: 50, y: 700 }, end: { x: 545, y: 700 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page1.drawText('TEST DESCRIPTION', { x: 50, y: 680, size: 9, font: fontBold });
  page1.drawText('OBSERVED VALUE', { x: 220, y: 680, size: 9, font: fontBold });
  page1.drawText('UNIT', { x: 330, y: 680, size: 9, font: fontBold });
  page1.drawText('REFERENCE INTERVAL', { x: 410, y: 680, size: 9, font: fontBold });

  const cbcRows = [
    ['Hemoglobin (Hb)', '14.2', 'g/dL', '12.0 - 16.0 (Normal)'],
    ['Total WBC Count', '6.8', 'K/uL', '4.0 - 11.0 (Normal)'],
    ['Platelet Count', '240', 'K/uL', '150 - 450 (Normal)'],
    ['RBC Count', '4.6', 'M/uL', '4.0 - 5.4 (Normal)'],
    ['Fasting Blood Glucose', '92', 'mg/dL', '70 - 99 (Optimal)']
  ];

  let y = 655;
  for (const row of cbcRows) {
    page1.drawText(row[0], { x: 50, y, size: 9, font: fontRegular });
    page1.drawText(row[1], { x: 220, y, size: 9, font: fontBold });
    page1.drawText(row[2], { x: 330, y, size: 9, font: fontRegular });
    page1.drawText(row[3], { x: 410, y, size: 9, font: fontRegular });
    y -= 22;
  }

  // --- Page 2: Lipid Profile & Differential ---
  const page2 = pdfDoc.addPage([595, 842]);
  page2.drawText('APOLLO MULTISPECIALITY HOSPITAL', { x: 50, y: 790, size: 16, font: fontBold, color: rgb(0, 0.4, 0.38) });
  page2.drawText('Page 2 of 2 — Lipid & Metabolic Profile', { x: 350, y: 790, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page2.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page2.drawText('LIPID PANEL MARKERS', { x: 50, y: 720, size: 10, font: fontBold });

  const lipidRows = [
    ['Total Cholesterol', '178', 'mg/dL', '125 - 200 (Desirable)'],
    ['HDL Cholesterol', '54', 'mg/dL', '> 50 (Normal)'],
    ['LDL Cholesterol', '102', 'mg/dL', '< 100 (Optimal/Borderline)'],
    ['Triglycerides', '110', 'mg/dL', '< 150 (Normal)']
  ];

  let y2 = 690;
  for (const row of lipidRows) {
    page2.drawText(row[0], { x: 50, y: y2, size: 9, font: fontRegular });
    page2.drawText(row[1], { x: 220, y: y2, size: 9, font: fontBold });
    page2.drawText(row[2], { x: 330, y: y2, size: 9, font: fontRegular });
    page2.drawText(row[3], { x: 410, y: y2, size: 9, font: fontRegular });
    y2 -= 22;
  }

  page2.drawText('CLINICAL IMPRESSION / AI PHYSICIAN REVIEW:', { x: 50, y: y2 - 30, size: 10, font: fontBold });
  page2.drawText('All hematological and metabolic indicators reside within desired physiological limits.', { x: 50, y: y2 - 50, size: 9, font: fontRegular });

  const pdfBytes = await pdfDoc.save();
  const pdfPath = path.join(fixturesDir, 'synthetic_multipage_report.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);

  // 2. Generate Dedicated Synthetic Urinalysis PDF Report
  const urineDoc = await PDFDocument.create();
  const urineBold = await urineDoc.embedFont(StandardFonts.HelveticaBold);
  const urineRegular = await urineDoc.embedFont(StandardFonts.Helvetica);
  const urinePage = urineDoc.addPage([595, 842]);

  urinePage.drawText('METROPOLIS CLINICAL LABORATORIES', { x: 50, y: 790, size: 16, font: urineBold, color: rgb(0, 0.35, 0.45) });
  urinePage.drawText('URINE ROUTINE & MICROSCOPIC EXAMINATION', { x: 50, y: 770, size: 11, font: urineBold, color: rgb(0.2, 0.2, 0.2) });
  urinePage.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  urinePage.drawText('Patient Name: Subject U-101', { x: 50, y: 735, size: 10, font: urineRegular });
  urinePage.drawText('Age / Gender: 29 / F', { x: 300, y: 735, size: 10, font: urineRegular });
  urinePage.drawText('Referred By: Dr. Priya Sen, MD', { x: 50, y: 715, size: 10, font: urineRegular });
  urinePage.drawText('Sample Date: 2026-10-18 09:15', { x: 300, y: 715, size: 10, font: urineRegular });
  urinePage.drawText('Specimen: Urine (Clean Catch Midstream)', { x: 50, y: 695, size: 9, font: urineRegular, color: rgb(0.4, 0.4, 0.4) });
  urinePage.drawLine({ start: { x: 50, y: 685 }, end: { x: 545, y: 685 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  urinePage.drawText('TEST PARAMETER', { x: 50, y: 665, size: 9, font: urineBold });
  urinePage.drawText('OBSERVED VALUE', { x: 230, y: 665, size: 9, font: urineBold });
  urinePage.drawText('REFERENCE INTERVAL', { x: 380, y: 665, size: 9, font: urineBold });

  const urineRows = [
    ['Specific Gravity', '1.020', '1.005 - 1.030'],
    ['Urine pH', '6.0', '5.0 - 8.0'],
    ['Urine Protein', 'Negative', 'Negative'],
    ['Urine Glucose', 'Negative', 'Negative'],
    ['Ketones', 'Negative', 'Negative'],
    ['Nitrite', 'Negative', 'Negative'],
    ['Leukocyte Esterase', 'Negative', 'Negative'],
    ['Microscopic WBC', '2-4 /HPF', '0 - 5 /HPF'],
    ['Microscopic RBC', '0-1 /HPF', '0 - 2 /HPF'],
    ['Bacteria', 'Nil', 'Nil'],
    ['Epithelial Cells', 'Few /HPF', '0 - 5 /HPF']
  ];

  let yUrine = 640;
  for (const row of urineRows) {
    urinePage.drawText(row[0], { x: 50, y: yUrine, size: 9, font: urineRegular });
    urinePage.drawText(row[1], { x: 230, y: yUrine, size: 9, font: urineBold });
    urinePage.drawText(row[2], { x: 380, y: yUrine, size: 9, font: urineRegular });
    yUrine -= 22;
  }

  urinePage.drawText('CLINICAL IMPRESSION: Normal physiological urinalysis profile. No indication of UTI.', { x: 50, y: yUrine - 25, size: 9, font: urineBold });

  const urineBytes = await urineDoc.save();
  const urinePath = path.join(fixturesDir, 'synthetic_urine_report.pdf');
  fs.writeFileSync(urinePath, urineBytes);
  console.log(`[Fixture Generator] Generated Urinalysis PDF: ${urinePath} (${urineBytes.length} bytes)`);

  // 3. Generate Dedicated Synthetic CBC Report PDF
  const cbcDoc = await PDFDocument.create();
  const cbcBold = await cbcDoc.embedFont(StandardFonts.HelveticaBold);
  const cbcRegular = await cbcDoc.embedFont(StandardFonts.Helvetica);
  const cbcPage = cbcDoc.addPage([595, 842]);

  cbcPage.drawText('APOLLO MULTISPECIALITY HOSPITAL', { x: 50, y: 790, size: 16, font: cbcBold, color: rgb(0, 0.4, 0.38) });
  cbcPage.drawText('COMPLETE BLOOD COUNT (CBC) PANEL', { x: 50, y: 770, size: 11, font: cbcBold, color: rgb(0.2, 0.2, 0.2) });
  cbcPage.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  cbcPage.drawText('Patient Name: Subject A-102', { x: 50, y: 735, size: 10, font: cbcRegular });
  cbcPage.drawText('Referred By: Dr. Sarah Jenkins, MD', { x: 50, y: 715, size: 10, font: cbcRegular });
  cbcPage.drawText('Sample Date: 2026-10-15 08:30', { x: 300, y: 715, size: 10, font: cbcRegular });

  let yCbc = 670;
  for (const row of cbcRows) {
    cbcPage.drawText(row[0], { x: 50, y: yCbc, size: 9, font: cbcRegular });
    cbcPage.drawText(row[1], { x: 220, y: yCbc, size: 9, font: cbcBold });
    cbcPage.drawText(row[2], { x: 330, y: yCbc, size: 9, font: cbcRegular });
    cbcPage.drawText(row[3], { x: 410, y: yCbc, size: 9, font: cbcRegular });
    yCbc -= 22;
  }

  const cbcBytes = await cbcDoc.save();
  const cbcPath = path.join(fixturesDir, 'synthetic_cbc_report.pdf');
  fs.writeFileSync(cbcPath, cbcBytes);
  console.log(`[Fixture Generator] Generated CBC PDF: ${cbcPath} (${cbcBytes.length} bytes)`);

  // 4. Generate Dedicated Synthetic Lipid Panel PDF
  const lipidDoc = await PDFDocument.create();
  const lBold = await lipidDoc.embedFont(StandardFonts.HelveticaBold);
  const lRegular = await lipidDoc.embedFont(StandardFonts.Helvetica);
  const lPage = lipidDoc.addPage([595, 842]);

  lPage.drawText('CITY HEALTH DIAGNOSTICS', { x: 50, y: 790, size: 16, font: lBold, color: rgb(0.1, 0.3, 0.6) });
  lPage.drawText('COMPREHENSIVE LIPID PROFILE', { x: 50, y: 770, size: 11, font: lBold, color: rgb(0.2, 0.2, 0.2) });
  lPage.drawLine({ start: { x: 50, y: 755 }, end: { x: 545, y: 755 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  lPage.drawText('Patient Name: Subject L-202', { x: 50, y: 735, size: 10, font: lRegular });
  lPage.drawText('Referred By: Dr. Kevin Zhao, MD', { x: 50, y: 715, size: 10, font: lRegular });
  lPage.drawText('Sample Date: 2026-10-12 08:00', { x: 300, y: 715, size: 10, font: lRegular });

  let yLip = 670;
  for (const row of lipidRows) {
    lPage.drawText(row[0], { x: 50, y: yLip, size: 9, font: lRegular });
    lPage.drawText(row[1], { x: 220, y: yLip, size: 9, font: lBold });
    lPage.drawText(row[2], { x: 330, y: yLip, size: 9, font: lRegular });
    lPage.drawText(row[3], { x: 410, y: yLip, size: 9, font: lRegular });
    yLip -= 22;
  }

  const lipidBytes = await lipidDoc.save();
  const lipidPath = path.join(fixturesDir, 'synthetic_lipid_report.pdf');
  fs.writeFileSync(lipidPath, lipidBytes);
  console.log(`[Fixture Generator] Generated Lipid PDF: ${lipidPath} (${lipidBytes.length} bytes)`);

  // 5. Generate Synthetic Minimal PNG
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x20,
    0x08, 0x02, 0x00, 0x00, 0x00, 0xFC, 0x18, 0xED,
    0xA3, 0x00, 0x00, 0x00, 0x01, 0x73, 0x52, 0x47,
    0x42, 0x00, 0xAE, 0xCE, 0x1C, 0xE9, 0x00, 0x00,
    0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x78, 0x5E,
    0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, 0x03, 0x01,
    0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
    0x60, 0x82
  ]);
  const pngPath = path.join(fixturesDir, 'synthetic_lab_image.png');
  fs.writeFileSync(pngPath, pngHeader);

  // 6. Generate Corrupt/Spoofed Document
  const corruptPath = path.join(fixturesDir, 'corrupt_spoofed_file.pdf');
  fs.writeFileSync(corruptPath, Buffer.from('NOT_A_PDF_HEADER_THIS_IS_PLAIN_TEXT'));

  return { pdfPath, urinePath, cbcPath, lipidPath, pngPath, corruptPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateFixtures().catch(console.error);
}
