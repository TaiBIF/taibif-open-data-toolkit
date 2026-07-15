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

Install dependencies:

```bash
npm install
```

Start the development app:

```bash
npm start
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
