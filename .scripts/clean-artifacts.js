import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

const target = process.argv[2];

const DIRS = {
  recordings: path.join(ROOT_DIR, 'recordings'),
  results: path.join(ROOT_DIR, 'test-results'),
  report: path.join(ROOT_DIR, 'test-report'),
  all: null,
};

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
  console.log(`Cleaned: ${dirPath}`);
}

if (target === 'all') {
  cleanDir(DIRS.recordings);
  cleanDir(DIRS.results);
  cleanDir(DIRS.report);
} else if (DIRS[target]) {
  cleanDir(DIRS[target]);
} else {
  console.error(`Unknown target: ${target}. Use: recordings | results | report | all`);
  process.exit(1);
}
