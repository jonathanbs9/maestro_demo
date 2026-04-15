import { execSync } from 'child_process';
import os from 'os';

const PORTS = [5037, 5554, 5555, 5556, 5557, 5558, 5559, 5560, 5561, 5584, 5585, 9999, 2077];
const isWindows = os.platform() === 'win32';

for (const port of PORTS) {
  try {
    if (isWindows) {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const pids = [...new Set(
        output.split('\n')
          .map(line => line.trim().split(/\s+/).pop())
          .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
      )];
      if (pids.length > 0) {
        for (const pid of pids) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`Killed process ${pid} on port ${port}`);
          } catch {
            // Process may have already exited
          }
        }
      } else {
        console.log(`No process found using port ${port}`);
      }
    } else {
      const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (pids) {
        execSync(`kill -9 ${pids}`);
        console.log(`Killed processes on port ${port}: ${pids}`);
      } else {
        console.log(`No process found using port ${port}`);
      }
    }
  } catch {
    console.log(`No process found using port ${port}`);
  }
}
