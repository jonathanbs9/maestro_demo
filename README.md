# Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [MacOS](#installation-macos)
  - [Windows 11](#installation-windows-11)
- [Environment Setup](#environment-setup)
- [Run on Android](#run-on-android)
  - [Quick Usage](#quick-usage)
  - [Detailed Usage](#detailed-usage)
  - [Reports](#reports)
  - [Troubleshooting](#troubleshooting)

# Prerequisites

The following tools must be installed and available in your `PATH` before using this project:

| Tool | Purpose | Min Version |
|---|---|---|
| [Node.js](https://nodejs.org/) | Run automation scripts | 20.x |
| [Android Studio](https://developer.android.com/studio) | Android emulator & ADB | Latest |
| [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro) | Mobile test runner | 2.3.0 (tested) |

> **Maestro CLI version:** This project was last tested with `2.3.0`. Newer versions should work but are not guaranteed — if you encounter unexpected behavior, install the tested version explicitly:
> ```bash
> # MacOS / Linux
> curl -fsSL "https://get.maestro.mobile.dev" | bash -s -- --version 2.3.0
> # Windows
> iex "& { $(iwr 'https://get.maestro.mobile.dev') } --version 2.3.0"
> ```

Make sure `adb` and `maestro` are accessible from your terminal:
```bash
adb --version
maestro --version
```

# Installation (MacOS)

1. Clone the repository
2. Give system access to scripts dir
```bash
chmod +x .scripts/
```
3. Install Maestro
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```
4. Install dependencies
```bash
npm install
```
5. Copy the environment file and fill in your values
```bash
cp .env.example .env
```

# Installation (Windows 11)

1. Clone the repository
2. Install [Node.js 20+](https://nodejs.org/) and [Android Studio](https://developer.android.com/studio)
3. Install Maestro CLI — open a terminal and run:
```powershell
iex "& { $(iwr 'https://get.maestro.mobile.dev') }"
```
> After installation, **restart the terminal** so `maestro` is available in the PATH.

4. Verify both tools are available:
```bash
adb --version
maestro --version
```
5. Install dependencies
```bash
npm install
```
6. Copy the environment file and fill in your values
```bash
copy .env.example .env
```

> **Android Emulator on Windows:** Open Android Studio → Device Manager → create an AVD with API 34, x86_64. Start the emulator before running tests. The `npm run env:setup` command does **not** auto-start the emulator on Windows — start it manually from Android Studio.

# Environment Setup

Sensitive values (email credentials, API keys, Slack tokens) are loaded from a `.env` file.
Copy the example and fill in the values you need:

```bash
# MacOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

See [`.env.example`](.env.example) for a description of each variable. Variables are only required for the features you intend to use — email reporting, Maestro Cloud, Device Cloud, or Slack notifications.

# Run on Android

## Check Prerequisites

Before running tests for the first time, verify your environment is ready:

```bash
npm run check:prerequisites
```

This will validate:
- Node.js 20+
- Maestro CLI in PATH
- ADB in PATH
- Android emulator running
- `node_modules` installed
- `.env` file present



## Quick Usage
1. Perform env cleanup
```bash
npm run env:cleanup
```
2. Perform env setup
```bash
npm run env:setup
```
3. Run the tests
```bash
npm run maestro:test:wikipedia
```
4. Perform env teardown
```bash
npm run env:teardown
```
### IMPORTANT
It is suggested to perform env cleanup before each run to avoid any potential issues with ports, processes and emulators.
So please repeat the cycle for the most optimal experience.

Optional:
- Run Maestro Studio for element inspection (this will open Maestro Studio in your default browser on port 9999)
```bash
npm run maestro:inspect
```
- Open report
```bash
npm run report:open
```
- Open AI report
```bash
npm run report:ai:open
```
- Record a test (this example will record a test for the `LaunchStepper` spec and save it to the `recordings` dir)
```bash
npm run maestro:record:wikipedia
```

## Detailed Usage
1. Get the app apk (download the latest build from the dev branch / ask your dev team on how to get it)
2. Start an Android emulator
```bash
npm run maestro:device:start:android
```
3. Install the app
```bash
npm run android:install:wikipedia (replace 'wikipedia' with your app apk)
```
4. Run tests
```bash
npm run maestro:test:wikipedia (adjust paths for .maestro/flows and .maestro/configs with your own settings)
```
5. Uninstall the app
```bash
npm run android:uninstall:wikipedia (replace 'wikipedia' with your app apk)
```
6. Stop the emulator
```bash
npm run maestro:device:stop
```

## Reports
1. Delete old reports
```bash
npm run report:delete
```
2. Open report
```bash
npm run report:open
```
3. Open AI report
```bash
npm run report:ai:open
```

## IMPORTANT
It is strongly suggested to kill the ports, processes and emulators manually (e.g. if your emulator/app is frozen or if you're done with the day and logging off):
```bash
npm run kill:ports
npm run kill:processes
npm run kill:emulators
```

## Example Flows

The `.maestro/flows/wikipedia/examples/` directory contains flows that are **excluded from the default test suite** and exist purely for demonstration purposes.

| File | Purpose |
|---|---|
| `FailingFlow.spec.yaml` | Shows what a failing Maestro test looks like in the terminal and HTML report |

To run an example flow manually:
```bash
maestro test .maestro/flows/wikipedia/examples/FailingFlow.spec.yaml -e appId=org.wikipedia
```

## Troubleshooting
### "App not installed" error
If you have Maestro Studio open and are trying to run the tests, you might get an "App not installed" error. 
This is because Maestro Studio is using the same emulator as the tests. 
To fix this, you need to close Maestro Studio and run the tests again.
- [Original workaround message on GitHub](https://github.com/mobile-dev-inc/Maestro/issues/1104#issuecomment-1872975969)
