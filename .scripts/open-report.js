import { default as open } from 'open';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, 'test-results');

// Find all ai-report HTML files
const entries = fs.readdirSync(RESULTS_DIR, { withFileTypes: true, recursive: true });
const reports = entries
  .filter(e => e.isFile() && e.name.startsWith('ai-report-') && e.name.endsWith('.html'))
  .map(e => path.join(e.path || path.join(RESULTS_DIR, e.name)));

if (reports.length === 0) {
  console.error('No AI report found in test-results/');
  process.exit(1);
}

for (const report of reports) {
  console.log(`Opening: ${report}`);
  await open(report);
}
