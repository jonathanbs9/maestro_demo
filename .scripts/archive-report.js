import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const RECORDINGS_DIR = path.join(ROOT_DIR, 'recordings');
const TEST_RESULTS_DIR = path.join(ROOT_DIR, 'test-results');
const OUTPUT_DIR = path.join(ROOT_DIR, 'test-report');

function resetOutputDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function formatTimestamp(date) {
  const pad = num => String(num).padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${hours}:${minutes}-${day}-${month}-${year}`;
}

function createArchive() {
  return new Promise((resolve, reject) => {
    resetOutputDir(OUTPUT_DIR);
    ensureDir(RECORDINGS_DIR);
    ensureDir(TEST_RESULTS_DIR);

    const timestamp = formatTimestamp(new Date());
    const archiveName = `test-report-${timestamp}.zip`;
    const archivePath = path.join(OUTPUT_DIR, archiveName);

    console.log('🗜️  Creating test report archive...');
    console.log(`   📁 Recordings: ${RECORDINGS_DIR}`);
    console.log(`   📁 Test results: ${TEST_RESULTS_DIR}`);
    console.log(`   🎯 Output: ${archivePath}`);

    const output = createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Archive created: ${archivePath} (${archive.pointer()} bytes)`);
      resolve(archivePath);
    });

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(RECORDINGS_DIR, path.basename(RECORDINGS_DIR));
    archive.directory(TEST_RESULTS_DIR, path.basename(TEST_RESULTS_DIR));
    archive.finalize();
  });
}

try {
  await createArchive();
} catch (error) {
  console.error('❌ Failed to archive report:', error.message);
  process.exit(1);
}
