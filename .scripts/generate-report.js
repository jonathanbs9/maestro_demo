import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');
const REPORT_DIR = path.join(__dirname, '..', 'test-results');
const REPORT_FILE = path.join(REPORT_DIR, 'test-report.html');

// Ensure directories exist
[REPORT_DIR, RECORDINGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const MIN_VALID_MP4_BYTES = 1024; // Files under 1 KB are considered corrupt/incomplete

// Get all video files from recordings directory with their status
function getRecordings() {
  try {
    const files = fs.readdirSync(RECORDINGS_DIR).filter(file => file.endsWith('.mp4'));
    const valid = [];
    const skipped = [];

    for (const file of files) {
      const filePath = path.join(RECORDINGS_DIR, file);
      const { size } = fs.statSync(filePath);

      if (size < MIN_VALID_MP4_BYTES) {
        skipped.push({ file, size });
        continue;
      }

      // Extract the base name and status from the filename
      // Format: {flowName}-{status}.mp4
      const baseName = path.basename(file, '.mp4');
      let name = baseName;
      let passed = true;

      // Check if filename ends with -passed or -failed
      if (baseName.endsWith('-passed')) {
        name = baseName.slice(0, -7); // Remove -passed
        passed = true;
      } else if (baseName.endsWith('-failed')) {
        name = baseName.slice(0, -7); // Remove -failed
        passed = false;
      }

      valid.push({
        name,
        originalName: baseName,
        path: path.relative(REPORT_DIR, filePath),
        passed,
        size,
      });
    }

    if (skipped.length > 0) {
      console.warn(`⚠️  Skipped ${skipped.length} incomplete/corrupt recording(s):`);
      skipped.forEach(({ file, size }) =>
        console.warn(`   - ${file} (${size} bytes — below ${MIN_VALID_MP4_BYTES}B threshold)`)
      );
    }

    return valid;
  } catch (error) {
    console.error('Error reading recordings directory:', error.message);
    return [];
  }
}

// Generate HTML report
function generateHTMLReport(recordings) {
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maestro Test Report</title>
  <style>
    :root {
      --color-pass: #4caf50;
      --color-fail: #f44336;
      --color-bg: #f5f5f5;
      --color-card: #ffffff;
      --color-text: #333333;
      --color-border: #e0e0e0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: var(--color-text);
      background-color: var(--color-bg);
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    
    h1 {
      margin-bottom: 1rem;
    }
    
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    select, button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid var(--color-border);
      background-color: white;
      cursor: pointer;
    }
    
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 2rem;
    }
    
    .test-card {
      background: var(--color-card);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    
    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .test-status {
      padding: 0.75rem 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .status-pass {
      color: var(--color-pass);
      background-color: rgba(76, 175, 80, 0.1);
    }
    
    .status-fail {
      color: var(--color-fail);
      background-color: rgba(244, 67, 54, 0.1);
    }
    
    .test-video {
      width: 100%;
      display: block;
      background: #000;
    }
    
    .test-name {
      padding: 1rem;
      font-family: monospace;
      font-size: 0.9rem;
      word-break: break-all;
      border-top: 1px solid var(--color-border);
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 1rem;
      color: #666;
    }
    
    .timestamp {
      color: #666;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    
    @media (max-width: 768px) {
      .test-grid {
        grid-template-columns: 1fr;
      }
      
      .filters {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Maestro Test Report</h1>
      <div class="filters">
        <select id="status-filter">
          <option value="all">All Tests</option>
          <option value="passed">✅ Passed</option>
          <option value="failed">❌ Failed</option>
        </select>
        <button id="refresh-btn">🔄 Refresh Report</button>
      </div>
      <div class="timestamp">Generated on: ${timestamp}</div>
    </header>
    
    <div class="test-grid" id="test-container">
      ${
        recordings.length === 0
          ? '<div class="empty-state">No test recordings found.</div>'
          : recordings
              .map(
                test => `
          <div class="test-card" data-status="${test.passed ? 'passed' : 'failed'}">
            <div class="test-status ${test.passed ? 'status-pass' : 'status-fail'}">
              ${test.passed ? '✅ Passed' : '❌ Failed'}
            </div>
            <video class="test-video" controls>
              <source src="${test.path}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <div class="test-name">${test.name}</div>
          </div>
        `
              )
              .join('')
      }
    </div>
  </div>

  <script>
    // Filter tests based on status
    document.getElementById('status-filter').addEventListener('change', (e) => {
      const status = e.target.value;
      const testCards = document.querySelectorAll('.test-card');
      
      testCards.forEach(card => {
        if (status === 'all' || card.dataset.status === status) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      window.location.reload();
    });
  </script>
</body>
</html>`;
}

// Main function
async function main() {
  return new Promise(resolve => {
    console.log('📊 Generating test report...');

    const recordings = getRecordings();
    console.log(`Found ${recordings.length} test recordings`);

    const html = generateHTMLReport(recordings);
    fs.writeFileSync(REPORT_FILE, html);

    console.log(`✅ Report generated: ${REPORT_FILE}`);
    resolve(REPORT_FILE);
  });
}

// Run the script
main();

// Export for testing
export { getRecordings, generateHTMLReport, main };
