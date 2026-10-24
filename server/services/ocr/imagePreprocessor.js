import sharp from 'sharp';

/**
 * Preprocesses prescription images before sending to Google Cloud Document AI.
 * Performs auto-orientation/rotation based on EXIF, contrast normalization,
 * and edge sharpening to maximize handwriting recognition accuracy.
 *
 * @param {Buffer} buffer - Original image or document buffer
 * @param {string} mimeType - Document MIME type
 * @returns {Promise<{ buffer: Buffer, preprocessed: boolean, operations: string[] }>}
 */
export async function preprocessPrescriptionImage(buffer, mimeType) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { buffer, preprocessed: false, operations: [] };
  }

  // PDFs are handled natively by Document AI; skip raster image operations
  if (mimeType === 'application/pdf') {
    return { buffer, preprocessed: false, operations: ['PDF_PASSTHROUGH'] };
  }

  const isImage = mimeType?.startsWith('image/') || /\.(jpe?g|png|webp|tiff|bmp)$/i.test(mimeType || '');
  if (!isImage) {
    return { buffer, preprocessed: false, operations: [] };
  }

  const operations = [];

  try {
    let pipeline = sharp(buffer);
    const metadata = await pipeline.metadata();

    // 1. Auto-rotate based on EXIF orientation tag
    pipeline = pipeline.rotate();
    operations.push('AUTO_ROTATE_EXIF');

    // 2. Grayscale & Contrast Normalization (enhances faint ink and deskews tonal range)
    // Enhances contrast between dark pen/pencil strokes and textured prescription pads
    pipeline = pipeline
      .toColorspace('srgb')
      .normalize() // Enhances dynamic contrast range
      .sharpen({
        sigma: 1.2,
        m1: 1.5,
        m2: 0.5
      });
    operations.push('CONTRAST_NORMALIZATION', 'STROKE_SHARPENING');

    // Format output to high-quality JPEG
    const preprocessedBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();

    return {
      buffer: preprocessedBuffer,
      preprocessed: true,
      operations,
      originalMetadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    };
  } catch (err) {
    console.warn('[ImagePreprocessor] Preprocessing warning, falling back to original buffer:', err.message);
    return {
      buffer,
      preprocessed: false,
      operations: ['FALLBACK_ORIGINAL'],
      error: err.message
    };
  }
}
