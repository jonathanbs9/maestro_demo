import http from 'http';
import path from 'path';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';
import { main } from './generate-report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to kill processes on a specific port (cross-platform)
function killPort(port) {
  try {
    if (os.platform() === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const pids = [
        ...new Set(
          output
            .split('\n')
            .map(line => line.trim().split(/\s+/).pop())
            .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
        ),
      ];
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch {
          /* already gone */
        }
      }
      if (pids.length) console.log(`Killed process(es) on port ${port}`);
    } else {
      const result = execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
      if (result && result.length) console.log(`Killed process(es) on port ${port}`);
    }
  } catch {
    // No process found or other error - that's fine
  }
}

const PORT = 2077;
const BASE_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.mjs': 'text/javascript',
  '.map': 'application/octet-stream',
};

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle root path by serving the test report
  let filePath =
    req.url === '/'
      ? path.join(BASE_DIR, 'test-results', 'test-report.html')
      : path.join(BASE_DIR, decodeURIComponent(req.url));

  // Prevent directory traversal
  filePath = path.normalize(filePath).replace(/(\/|\\)\.\.(\/|\\|$)/, '');

  try {
    // Check if file exists
    let stats;
    try {
      stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        stats = await fs.stat(filePath);
      }
    } catch (_err) {
      // If file doesn't exist, try to find it case-insensitively
      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);

      try {
        const files = await fs.readdir(dir);
        // Normalize both filenames for comparison (case-insensitive and trim whitespace)
        const normalizedTarget = fileName.toLowerCase().trim();
        const foundFile = files.find(f => f.toLowerCase().trim() === normalizedTarget);

        if (foundFile) {
          filePath = path.join(dir, foundFile);
          stats = await fs.stat(filePath);
        } else {
          console.error(`File not found: ${filePath}`);
          throw new Error('File not found');
        }
      } catch (_err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    // Set content type based on file extension
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Read and serve the file
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(data, 'utf-8');
  } catch (err) {
    console.error(`Error serving ${filePath}:`, err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
});

// Kill any existing processes on the port
killPort(PORT);

// Start the server
async function startServer() {
  try {
    // Generate the report first
    console.log('📊 Generating test report...');
    await main();

    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n📊 Test report server running at:`);
      console.log(`   Local:   http://localhost:${PORT}/`);
      const localIp =
        Object.values(os.networkInterfaces())
          .flat()
          .find(i => i?.family === 'IPv4' && !i.internal)?.address || 'localhost';
      console.log(`   Network: http://${localIp}:${PORT}/`);
      console.log('\n🔄 The report will automatically update when files change');
      console.log('   Press Ctrl+C to stop the server\n');

      // Try to open the browser automatically
      (async () => {
        try {
          const open = (await import('open')).default;
          await open(`http://localhost:${PORT}/`);
        } catch (_err) {
          console.log(
            'Could not open browser automatically. Please open the URL above in your browser.'
          );
        }
      })();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  process.exit(0);
});

// Export for testing
export default server;
