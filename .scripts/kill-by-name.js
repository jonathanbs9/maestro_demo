import { execSync } from 'child_process';
import os from 'os';

// Usage: node kill-by-name.js <processName> [processName2 ...]
// Kills processes matching the given names. Exits 0 even if none found.

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('Usage: node kill-by-name.js <processName> [...]');
  process.exit(1);
}

const isWindows = os.platform() === 'win32';

for (const name of names) {
  try {
    if (isWindows) {
      execSync(`taskkill /IM "${name}.exe" /F`, { stdio: 'ignore' });
      console.log(`Killed: ${name}`);
    } else {
      execSync(`pkill -f "${name}"`, { stdio: 'ignore' });
      console.log(`Killed: ${name}`);
    }
  } catch {
    // No matching process — that's fine
  }
}
