/** Extract explicitly labelled facility metadata from OCR text without guessing. */
export const extractLabeledMetadata = (text, labels) => {
  if (typeof text !== 'string' || !text.trim() || !(labels instanceof RegExp)) return null;
  const pattern = new RegExp('(?:^|\\n)\\s*' + labels.source + '\\s*[:\\-]\\s*([^\\r\\n]{2,120})', 'i');
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
};
