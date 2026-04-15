import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAESTRO_BIN = path.join(os.homedir(), '.maestro/bin/maestro');
const CONFIG_PATH = path.join(__dirname, '..', '.maestro/config.yaml');
const RECORDINGS_DIR = path.join(__dirname, '..', 'recordings');

// Define your flow paths here
const flowPaths = [
  // Example:
  // '.maestro/flows/wikipedia/conditional/LaunchStepper.spec.yaml'
];

// Function to find all YAML files in a directory
function findYamlFiles(dir) {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let yamlFiles = [];

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        yamlFiles = [...yamlFiles, ...findYamlFiles(fullPath)];
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        yamlFiles.push(fullPath);
      }
    }

    return yamlFiles;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    return [];
  }
}

// Function to run maestro record and capture test status
async function recordFlow(flowPath) {
  try {
    const flowName = path.basename(flowPath, path.extname(flowPath));

    // Create recordings directory if it doesn't exist
    if (!fs.existsSync(RECORDINGS_DIR)) {
      fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
    }

    // Record the flow directly - pass/fail status determined from recording exit code
    const tempOutputFile = path.join(RECORDINGS_DIR, `${flowName}-recording-temp.mp4`);
    if (fs.existsSync(tempOutputFile)) {
      fs.unlinkSync(tempOutputFile);
    }

    console.log(`\n🔵 Starting recording for: ${flowPath}`);
    const recordCmd = [
      MAESTRO_BIN,
      'record',
      '--local',
      `"${flowPath}"`,
      `"${tempOutputFile}"`,
      `--config "${CONFIG_PATH}"`,
      '-e appId=org.wikipedia',
    ].join(' ');

    console.log(`   Command: ${recordCmd}`);

    try {
      execSync(recordCmd, { stdio: 'inherit' });
      const finalOutputFile = path.join(RECORDINGS_DIR, `${flowName}-passed.mp4`);
      if (fs.existsSync(tempOutputFile)) {
        if (fs.existsSync(finalOutputFile)) {
          fs.unlinkSync(finalOutputFile);
        }
        fs.renameSync(tempOutputFile, finalOutputFile);
      }
      console.log(`✅ Successfully recorded: ${flowName} (passed)`);
      console.log(`   Output: ${finalOutputFile}`);
      return { success: true, passed: true };
    } catch (recordError) {
      // Test failed during recording - save as failed recording
      const failedOutputFile = path.join(RECORDINGS_DIR, `${flowName}-failed.mp4`);
      if (fs.existsSync(tempOutputFile)) {
        try {
          if (fs.existsSync(failedOutputFile)) {
            fs.unlinkSync(failedOutputFile);
          }
          fs.renameSync(tempOutputFile, failedOutputFile);
          console.log(`❌ Test failed: ${flowName}`);
          console.log(`   Saved recording as: ${failedOutputFile}`);
          return { success: true, passed: false };
        } catch (renameError) {
          console.error('   Warning: could not rename temp recording file:', renameError.message);
        }
      }

      console.error(`❌ Recording failed for ${flowName}:`, recordError.message);
      return { success: false, passed: false, error: recordError.message };
    }
  } catch (error) {
    console.error(`❌ Error processing ${flowPath}:`, error.message);
    return { success: false, passed: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Maestro flow recording...');

  // If no specific flows are defined, search for all YAML files in .maestro/flows
  const defaultSearchDir = path.join(__dirname, '..', '.maestro/flows');
  const flowsToRecord =
    flowPaths.length > 0 ? flowPaths.map(p => path.resolve(p)) : findYamlFiles(defaultSearchDir);

  if (flowsToRecord.length === 0) {
    console.log('ℹ️  No flow files found to record.');
    console.log(`   Please add flow file paths to the flowPaths array in ${__filename}`);
    console.log(`   or place your YAML files in ${defaultSearchDir}`);
    return;
  }

  console.log(`📋 Found ${flowsToRecord.length} flow(s) to record:`);
  flowsToRecord.forEach((flow, index) => {
    console.log(`   ${index + 1}. ${flow}`);
  });

  let recordedCount = 0;
  let testPassedCount = 0;
  let testFailedCount = 0;

  for (const flow of flowsToRecord) {
    const result = await recordFlow(flow);
    if (!result) {
      continue;
    }

    if (result.passed) {
      testPassedCount++;
    } else {
      testFailedCount++;
    }

    if (result.success) {
      recordedCount++;
    }

    // Small delay between recordings
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n✨ Recording completed!`);
  console.log(`     ✅ Passed: ${testPassedCount}`);
  console.log(`     ❌ Failed: ${testFailedCount}`);
  console.log(`\nRecordings saved to: ${RECORDINGS_DIR}`);

  const hasTestFailures = testFailedCount > 0;
  const hasRecordingFailures = recordedCount < flowsToRecord.length;

  // Return the results for potential use by other scripts
  const summary = {
    total: flowsToRecord.length,
    recorded: recordedCount,
    passed: testPassedCount,
    failed: testFailedCount,
    recordingsDir: RECORDINGS_DIR,
  };

  if (hasTestFailures || hasRecordingFailures) {
    console.error('\n❌ Some flows failed. Setting non-zero exit code.');
    process.exitCode = 1;
  }

  return summary;
}

// Run the script
main().catch(console.error);
