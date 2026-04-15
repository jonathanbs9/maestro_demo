import { execSync } from 'child_process';
import os from 'os';

const isWindows = os.platform() === 'win32';
const MASKS = [
  'maestro',
  'qemu-system',
  'emulator',
  'adb',
  'Android Emulator',
  'AndroidStudio',
  'studio',
];

console.log('Killing all automation framework-related processes');

for (const mask of MASKS) {
  try {
    if (isWindows) {
      const output = execSync(`tasklist /FI "IMAGENAME eq ${mask}.exe" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = output
        .trim()
        .split('\n')
        .filter(l => l && !l.includes('No tasks'));
      if (lines.length > 0) {
        execSync(`taskkill /IM "${mask}.exe" /F`, { stdio: 'ignore' });
        console.log(`Killed processes matching '${mask}'`);
      }
    } else {
      const pids = execSync(`pgrep -f "${mask}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      if (pids) {
        for (const pid of pids.split('\n')) {
          try {
            execSync(`kill -9 ${pid}`);
            console.log(`Killed PID ${pid} (matched by '${mask}')`);
          } catch {
            // Process may have already exited
          }
        }
      }
    }
  } catch {
    // No matching processes found
  }
}

console.log('All matching automation framework processes killed.');
