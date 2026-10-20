# Development Guide

[Back to README](../README.md)

### Requirements

- Node.js 22 is recommended.
- npm 7 or later is required.
- Native dependencies are used by the app, including `sqlite3`.

For macOS development, install Xcode Command Line Tools if native dependency installation fails:

```bash
xcode-select --install
```

For Windows development, install the Visual Studio Build Tools with C++ build support if native dependency installation fails.

Install dependencies:

```bash
npm ci
```

Start the development app:

```bash
npm run start
```

Build the application code:

```bash
npm run build
```

Package the desktop application for the current platform:

```bash
npm run package
```

`npm run build` builds the application code. To generate a packaged desktop application, use `npm run package`.

### Development Database

The bundled base SQLite database is stored at:

```text
assets/odt.sqlite3
```

In development mode, the app reads this file directly.

In packaged builds, this same file is bundled into the app resources. On startup, the packaged app copies the bundled database into the app user data folder when the user data database does not exist, then reads and writes the user data copy.

This database is intended to be a clean starting point. After cloning the repository and starting the app, create a project and select a template before using the data editing and data cleaning tables.

The packaged app also checks the user data database with SQLite integrity checking and rebuilds it from the bundled database if corruption is detected. If the user data database is healthy, app updates do not replace user-created projects or table data. Instead, the app syncs bundled system tables such as `intro` and `template_*` tables when the app version changes.

### Native Dependency Notes

During dependency installation, the project runs post-install steps that prepare Electron runtime dependencies:

```text
electron-builder install-app-deps
```

If installation fails around `sqlite3`, `node-gyp`, or native module rebuilding, first confirm that Node.js 22 is being used and that the platform build tools listed above are installed.

The release workflow installs dependencies in separate steps to make native dependency issues easier to isolate:

```bash
npm ci --ignore-scripts
npm --prefix release/app ci
npm run build:dll
```

This avoids running the root `postinstall` script too early in CI. Local development can usually use `npm ci` directly, but the split workflow is useful when diagnosing dependency installation problems.

## Project Structure

- `src/main`: Electron main process, IPC handlers, database integration, and system-level logic.
- `src/renderer`: User interface, pages, components, styles, and localization files.
- `src/shared`: Shared constants and types used by both main and renderer processes.
- `assets`: Application icons, images, and base data files.
- `release/app`: Runtime package metadata and production dependencies used during packaging.

