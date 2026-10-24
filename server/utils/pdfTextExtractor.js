import zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';

/**
 * Extracts raw textual content from each page of a PDF buffer
 * @param {Buffer|Uint8Array} buffer 
 * @returns {Promise<Array<{ pageNumber: number, text: string }>>}
 */
export async function extractTextFromPdfBuffer(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const extractedPages = [];

    for (let pIndex = 0; pIndex < pageCount; pIndex++) {
      const page = pdfDoc.getPage(pIndex);
      let pageText = '';

      const contents = page.node.Contents();
      if (contents) {
        const streamRefs = typeof contents.asArray === 'function' ? contents.asArray() : [contents];

        for (const ref of streamRefs) {
          const stream = pdfDoc.context.lookup(ref);
          if (!stream || !stream.contents) continue;

          let rawBytes = Buffer.from(stream.contents);
          try {
            rawBytes = zlib.inflateSync(rawBytes);
          } catch {
            // Uncompressed or different encoding
          }

          const streamStr = rawBytes.toString('utf8');
          const lines = streamStr.split(/\r?\n/);
          
          for (const line of lines) {
            // Check for TJ array: [(string) -10 (other)] TJ
            const tjMatch = line.match(/\[(.*)\]\s*TJ/i);
            if (tjMatch) {
              const arrayContent = tjMatch[1];
              const parts = [];
              const innerRegex = /(?:\(([^)]*)\)|<([0-9a-fA-F]+)>)/g;
              let m;
              while ((m = innerRegex.exec(arrayContent)) !== null) {
                if (m[1] !== undefined) parts.push(m[1]);
                else if (m[2] !== undefined) parts.push(Buffer.from(m[2], 'hex').toString('utf8'));
              }
              if (parts.length > 0) {
                pageText += parts.join('') + '\n';
              }
              continue;
            }

            // Check for Tj string: (string) Tj or <hex> Tj
            const tjSingleMatch = line.match(/(?:\(([^)]*)\)|<([0-9a-fA-F]+)>)\s*Tj/i);
            if (tjSingleMatch) {
              if (tjSingleMatch[1] !== undefined) {
                pageText += tjSingleMatch[1] + '\n';
              } else if (tjSingleMatch[2] !== undefined) {
                pageText += Buffer.from(tjSingleMatch[2], 'hex').toString('utf8') + '\n';
              }
            }
          }
        }
      }

      extractedPages.push({
        pageNumber: pIndex + 1,
        text: pageText.trim()
      });
    }

    return extractedPages;
  } catch (err) {
    console.warn('[PDF Text Extractor] Failed to parse PDF buffer:', err.message);
    return [];
  }
}
