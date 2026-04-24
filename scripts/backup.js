import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL;
const backupDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `backup-${timestamp}.sql`);

console.log('🚀 Starting Database Backup...');

// Command to run pg_dump
// Note: pg_dump must be installed on your system
const command = `pg_dump "${dbUrl}" > "${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Backup Failed: ${error.message}`);
    console.log('\n💡 Tip: Make sure PostgreSQL (pg_dump) is installed on your system.');
    return;
  }
  if (stderr) {
    console.warn(`⚠️ Warning: ${stderr}`);
  }
  console.log(`✅ Backup Successful! File saved to: ${backupPath}`);
});
