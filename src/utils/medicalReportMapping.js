export function formatClinicalDate(value) {
  if (!value) return null;
  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0)
    : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeStatus(status, isAbnormal) {
  const raw = String(status || '').toUpperCase();
  if (raw === 'NORMAL' || raw === 'WITHIN RANGE' || raw === 'VERIFIED') return 'Normal';
  if (raw === 'HIGH' || raw === 'CRITICAL' || isAbnormal === true) return raw === 'CRITICAL' ? 'Critical' : 'Slightly Elevated';
  if (raw === 'LOW') return 'Low';
  if (raw === 'BORDERLINE') return 'Borderline';
  if (raw === 'UNKNOWN') return 'Needs Review';
  if (status) return status;
  return 'Needs Review';
}

export function mapLabResultsToBiomarkers(items = [], defaultCategory = 'Clinical Marker') {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    const referenceRange = item?.referenceRange || item?.referenceInterval || {};
    const rawRange = item?.rawRange || referenceRange.rawRange || (
      referenceRange.low != null && referenceRange.high != null
        ? String(referenceRange.low) + ' - ' + String(referenceRange.high)
        : 'Unavailable'
    );
    const value = item?.value !== undefined && item?.value !== null
      ? item.value
      : (item?.numericValue !== undefined && item?.numericValue !== null
        ? item.numericValue
        : (item?.rawValue || 'N/A'));
    return {
      ...item,
      id: item?.id || 'bm-' + index,
      name: item?.name || item?.testName || 'Unlabelled marker',
      category: item?.category || defaultCategory,
      value,
      numericValue: item?.numericValue ?? (typeof value === 'number' ? value : null),
      rawValue: item?.rawValue ?? (value === 'N/A' ? null : String(value)),
      unit: item?.unit || '',
      minRange: item?.minRange ?? referenceRange.low ?? null,
      maxRange: item?.maxRange ?? referenceRange.high ?? null,
      rawRange,
      status: normalizeStatus(item?.status, item?.isAbnormal),
      explanation: item?.explanation || item?.interpretation || 'Clinical measurement extracted from the supplied report.',
      historicalReadings: Array.isArray(item?.historicalReadings) ? item.historicalReadings : [],
      evidence: item?.evidence || null
    };
  });
}

export function mapSavedReport(report = {}) {
  const analysis = report.aiAnalysis && typeof report.aiAnalysis === 'object' ? report.aiAnalysis : {};
  const metadata = analysis.metadata && typeof analysis.metadata === 'object'
    ? analysis.metadata
    : (report.metadata || {});
  const extractedBiomarkers = Array.isArray(analysis.extractedBiomarkers) && analysis.extractedBiomarkers.length > 0
    ? analysis.extractedBiomarkers
    : (Array.isArray(analysis.labResults) ? analysis.labResults : []);
  const facilityName = metadata.facilityName || report.hospital?.name || report.hospitalName || '';
  const reportDate = report.reportDate || metadata.reportDate || metadata.documentDate || null;
  const visitDate = report.visitDate || report.visit?.visitDate || metadata.visitDate || metadata.collectionDate || null;

  return {
    ...report,
    reportDate,
    visitDate,
    date: formatClinicalDate(reportDate) || 'Not recorded',
    doctorName: report.physicianName || report.doctorName || metadata.clinicianName || '',
    hospitalName: facilityName || 'Facility not identified',
    labName: facilityName || 'Facility not identified',
    patientName: report.patientName || metadata.patientName || '',
    patientAge: report.patientAge || metadata.patientAge || '',
    patientSex: report.patientSex || metadata.patientSex || '',
    patientIdentifier: report.patientIdentifier || metadata.patientIdentifier || '',
    biomarkers: mapLabResultsToBiomarkers(extractedBiomarkers, report.category || 'Clinical Marker')
  };
}

export function buildPersistedClinicalAnalysis(rawAnalysis, biomarkers, draft = {}) {
  const source = rawAnalysis && typeof rawAnalysis === 'object' ? rawAnalysis : {};
  const sourceMetadata = source.metadata && typeof source.metadata === 'object' ? source.metadata : {};
  const facility = draft.hospitalDetected && draft.hospitalName
    ? draft.hospitalName
    : (sourceMetadata.facilityName || (draft.hospitalName && draft.hospitalName !== 'Unidentified facility' ? draft.hospitalName : null));

  return {
    ...source,
    metadata: {
      ...sourceMetadata,
      facilityName: facility,
      clinicianName: draft.doctorName || sourceMetadata.clinicianName || null,
      patientName: draft.patientName || sourceMetadata.patientName || null,
      patientAge: draft.patientAge || sourceMetadata.patientAge || null,
      patientSex: draft.patientSex || sourceMetadata.patientSex || null,
      patientIdentifier: draft.patientIdentifier || sourceMetadata.patientIdentifier || null,
      reportDate: draft.reportDate || sourceMetadata.reportDate || sourceMetadata.documentDate || null,
      visitDate: draft.visitDate || sourceMetadata.visitDate || sourceMetadata.collectionDate || null
    },
    labResults: Array.isArray(source.labResults) ? source.labResults : [],
    extractedBiomarkers: mapLabResultsToBiomarkers(biomarkers, draft.category || source.category || 'Clinical Marker')
  };
}
