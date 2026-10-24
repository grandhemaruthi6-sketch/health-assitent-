import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in server/data/healthcopilot.db
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'healthcopilot.db');

export function getDatabase(customPath = null) {
  const targetPath = customPath || dbPath;
  const db = new Database(targetPath);

  // Enable WAL (Write-Ahead Logging) for high concurrency and performance
  db.pragma('journal_mode = WAL');
  
  // Enforce foreign key constraints
  db.pragma('foreign_keys = ON');

  // Synchronous NORMAL is optimal for WAL mode
  db.pragma('synchronous = NORMAL');

  return db;
}

export const db = getDatabase();
