import { execSync } from 'child_process';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

const ok = msg => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const fail = msg => console.log(`  ${RED}✘${RESET}  ${msg}`);
const warn = msg => console.log(`  ${YELLOW}!${RESET}  ${msg}`);

function run(cmd) {
  try {
    return {
      stdout: execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(),
      ok: true,
    };
  } catch (e) {
    return { stdout: '', stderr: e.message, ok: false };
  }
}

let passed = 0;
let failed = 0;

console.log(`\n${BOLD}Maestro Demo — Prerequisites Check${RESET}\n`);

// ── Node.js ──────────────────────────────────────────────────────────────────
const node = run('node --version');
if (node.ok) {
  const version = parseInt(node.stdout.replace('v', '').split('.')[0], 10);
  if (version >= 20) {
    ok(`Node.js ${node.stdout} (>=20 required)`);
    passed++;
  } else {
    fail(`Node.js ${node.stdout} — version 20+ required`);
    failed++;
  }
} else {
  fail('Node.js not found — install from https://nodejs.org/');
  failed++;
}

// ── Maestro CLI ───────────────────────────────────────────────────────────────
const maestro = run('maestro --version');
if (maestro.ok) {
  ok(`Maestro CLI ${maestro.stdout}`);
  passed++;
} else {
  fail('Maestro CLI not found — see README for installation instructions');
  failed++;
}

// ── ADB ───────────────────────────────────────────────────────────────────────
const adb = run('adb --version');
if (adb.ok) {
  const firstLine = adb.stdout.split('\n')[0];
  ok(`ADB — ${firstLine}`);
  passed++;
} else {
  fail('ADB not found — install Android Studio and add platform-tools to PATH');
  failed++;
}

// ── Android Emulator ─────────────────────────────────────────────────────────
const devices = run('adb devices');
if (devices.ok) {
  const emulators = devices.stdout
    .split('\n')
    .filter(line => line.startsWith('emulator-') && line.includes('device'));

  if (emulators.length > 0) {
    ok(`Android emulator running — ${emulators[0].split('\t')[0]}`);
    passed++;
  } else {
    warn('No Android emulator detected — start one from Android Studio before running tests');
    // warn is not a hard failure, tests won't run but setup can still proceed
  }
} else {
  warn('Could not query ADB devices — make sure ADB is working');
}

// ── npm dependencies ──────────────────────────────────────────────────────────
const nm = run(
  "node -e \"import('fs').then(fs => process.exit(fs.default.existsSync('node_modules') ? 0 : 1))\""
);
if (nm.ok) {
  ok('node_modules present');
  passed++;
} else {
  fail('node_modules not found — run: npm install');
  failed++;
}

// ── .env file ─────────────────────────────────────────────────────────────────
const env = run(
  "node -e \"import('fs').then(fs => process.exit(fs.default.existsSync('.env') ? 0 : 1))\""
);
if (env.ok) {
  ok('.env file present');
  passed++;
} else {
  warn(
    '.env file not found — email reporting and cloud features will not work (copy .env.example to .env)'
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(
  `\n${BOLD}Result:${RESET} ${GREEN}${passed} passed${RESET}${failed > 0 ? `, ${RED}${failed} failed${RESET}` : ''}\n`
);

if (failed > 0) {
  console.log(`${RED}Fix the issues above before running tests.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}All required prerequisites are satisfied. You're good to go!${RESET}\n`);
}
