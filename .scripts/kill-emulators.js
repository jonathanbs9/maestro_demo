import { execSync, spawnSync } from 'child_process';

let output;
try {
  output = execSync('adb devices', { encoding: 'utf8' });
} catch {
  console.log('adb not available or no devices found.');
  process.exit(0);
}

const emulators = output
  .split('\n')
  .filter(line => line.startsWith('emulator-'))
  .map(line => line.split('\t')[0].trim());

if (emulators.length === 0) {
  console.log('No emulators running.');
  process.exit(0);
}

for (const device of emulators) {
  console.log(`Killing emulator: ${device}`);
  spawnSync('adb', ['-s', device, 'emu', 'kill'], { stdio: 'inherit' });
}
