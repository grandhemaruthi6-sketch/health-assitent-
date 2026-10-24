import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base private vault directory
const VAULT_BASE_DIR = process.env.SECURE_VAULT_DIR || path.join(__dirname, '..', 'storage', 'private_vaults');

if (!fs.existsSync(VAULT_BASE_DIR)) {
  fs.mkdirSync(VAULT_BASE_DIR, { recursive: true });
}

const STORAGE_SECRET = process.env.STORAGE_SIGNING_SECRET || process.env.JWT_SECRET || 'healthcopilot_storage_secret_key_2026';
const SIGNED_URL_TTL_SECONDS = 15 * 60; // 15 minutes

export class SecureStorageService {
  /**
   * Computes SHA-256 hash of buffer for duplicate detection
   */
  static computeFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Stores document buffer in a private user-isolated directory
   * @param {string} userId - Authenticated user ID
   * @param {string} reportId - Unique report UUID
   * @param {string} originalFileName - Original uploaded filename
   * @param {Buffer} buffer - Validated file buffer
   * @returns {{ storagePath: string, fileSizeBytes: number, fileHash: string }}
   */
  static saveFile(userId, reportId, originalFileName, buffer) {
    if (!userId || !reportId) {
      throw new Error('UserId and ReportId are required for private storage isolation.');
    }

    const userVaultDir = path.join(VAULT_BASE_DIR, userId);
    if (!fs.existsSync(userVaultDir)) {
      fs.mkdirSync(userVaultDir, { recursive: true });
    }

    // Sanitize filename
    const cleanName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `${reportId}_${cleanName}`;
    const fullPath = path.join(userVaultDir, storedFileName);

    fs.writeFileSync(fullPath, buffer);

    // Relative storage path stored in DB
    const relativePath = path.join(userId, storedFileName);

    return {
      storagePath: relativePath,
      fileSizeBytes: buffer.length,
      fileHash: this.computeFileHash(buffer)
    };
  }

  /**
   * Reads file from private vault with user authorization check
   */
  static readFile(userId, relativeStoragePath) {
    // Prevent path traversal
    const safePath = path.normalize(relativeStoragePath).replace(/^(\.\.[\/\\])+/, '');
    const expectedPrefix = path.normalize(userId);

    if (!safePath.startsWith(expectedPrefix)) {
      throw new Error('Access Denied: Attempted path traversal or cross-user file access.');
    }

    const fullPath = path.join(VAULT_BASE_DIR, safePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Requested document not found in private vault.');
    }

    return fs.readFileSync(fullPath);
  }

  /**
   * Deletes a file from the user's private vault
   */
  static deleteFile(userId, relativeStoragePath) {
    try {
      const safePath = path.normalize(relativeStoragePath).replace(/^(\.\.[\/\\])+/, '');
      if (safePath.startsWith(path.normalize(userId))) {
        const fullPath = path.join(VAULT_BASE_DIR, safePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      console.warn('[SecureStorage] Error deleting file:', e.message);
    }
  }

  /**
   * Generates a short-lived signed access token for secure downloads
   * @param {string} userId - Owner user ID
   * @param {string} reportId - Target report ID
   * @param {number} [expiresInSeconds=900] - Expiration duration (default 15m)
   * @returns {string} Signed JWT token
   */
  static generateSignedUrlToken(userId, reportId, expiresInSeconds = SIGNED_URL_TTL_SECONDS) {
    return jwt.sign(
      {
        sub: userId,
        reportId: reportId,
        purpose: 'file_download'
      },
      STORAGE_SECRET,
      { expiresIn: expiresInSeconds }
    );
  }

  /**
   * Verifies signed download token and enforces ownership
   */
  static verifySignedToken(token, requestingUserId, expectedReportId) {
    try {
      const decoded = jwt.verify(token, STORAGE_SECRET);

      if (decoded.purpose !== 'file_download') {
        throw new Error('Invalid token purpose.');
      }

      if (requestingUserId && decoded.sub !== requestingUserId) {
        throw new Error('Access Denied: Signed URL belongs to a different user account.');
      }

      if (expectedReportId && decoded.reportId !== expectedReportId) {
        throw new Error('Access Denied: Signed URL is not valid for this report ID.');
      }

      return decoded;
    } catch (err) {
      throw new Error(`Invalid or expired download token: ${err.message}`);
    }
  }
}
