# TaiBIF Open Data Toolkit

## Overview

TaiBIF Open Data Toolkit is a desktop application designed for processing biodiversity open data according to the [Darwin Core](https://dwc.tdwg.org/) standard. It helps data providers move through the core dataset preparation workflow:

1. Creating a data template
2. Editing data
3. Validating datasets
4. Cleaning data

Developed by TaiBIF (Taiwan Biodiversity Information Facility), this toolkit helps biodiversity data providers, especially Mandarin-speaking users, streamline dataset preparation and meet global publishing standards such as GBIF through IPT (Integrated Publishing Toolkit).

The toolkit is currently designed primarily for Mandarin users, while the interface also includes English and Spanish translations.

## Features

### Template Generator

Quickly create data templates for common biodiversity dataset types, including Checklist, Occurrence, and Sampling Event datasets.

The template workflow supports:

- Darwin Core-based field selection.
- Field descriptions and reference information.
- Custom fields for project-specific needs.
- Clear labeling of custom fields in the template field list.

### Spreadsheet-like Editing Interface

Edit dataset records in a familiar table-based interface similar to a spreadsheet.

The editing workflow supports:

- Inline data editing.
- Adding and deleting blank rows.
- Importing and exporting table data.
- Field value summaries for reviewing data distribution.
- Automatic table page sizing based on the available window space.

### Data Import and Field Mapping

Import existing datasets and map source columns to project fields.

The mapping workflow helps users:

- Match imported field names to template fields.
- Review mapped, unmapped, and duplicated fields.
- Convert existing files into a structure aligned with the selected Darwin Core template.

### Darwin Core Validator

Validate datasets before publication and quickly identify records that need correction.

The validation workflow checks for issues such as:

- Missing required fields.
- Field name mismatches.
- Invalid dates, coordinates, identifiers, and controlled vocabulary values.
- Empty optional fields and duplicated identifiers.

### Data Cleaning Tools

Use data cleaning tools to find, filter, and standardize inconsistent values before publishing.

The cleaning workflow includes:

- Text filtering with exact, fuzzy, and regular expression search modes.
- Duplicate value filtering for selected fields.
- String replacement with exact, fuzzy, and regular expression search modes.
- Field value swapping.
- Species information synchronization.
- Filter clearing and data export.

### Darwin Core Archive Preparation

Cleaned and validated data can be exported for downstream publishing workflows, including preparation for IPT upload and GBIF publication.

## Intended Users

TaiBIF Open Data Toolkit is intended for:

- Biodiversity data providers.
- Researchers and data managers preparing Darwin Core datasets.
- Organizations publishing biodiversity data through IPT and GBIF.
- Users who need a Mandarin-friendly workflow for biodiversity data standardization.

## Development

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

In packaged builds, this same file is bundled into the app resources. On startup, the packaged app copies the bundled database into the app user data folder when needed, then reads and writes the user data copy.

This database is intended to be a clean starting point. After cloning the repository and starting the app, create a project and select a template before using the data editing and data cleaning tables.

The packaged app also checks the user data database with SQLite integrity checking and rebuilds it from the bundled database if corruption is detected.

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

## Contact

For questions, collaboration, or feedback, please contact the TaiBIF team via the [official contact form](https://portal.taibif.tw/zh-hant/contact-us).

## License

This project is released under the MIT License. See `LICENSE` for details.

This project is based on Electron React Boilerplate. See `NOTICE` for attribution information.
