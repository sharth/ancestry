# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Angular 22 single-page app for viewing and editing a genealogy database stored as a GEDCOM file. It runs entirely client-side using the File System Access API: the user picks a `.gedcom` file (and optionally a multimedia directory) from local disk, the app parses it in memory, and edits are written back to the same file on disk. There is no backend server or remote API — `Dexie`/IndexedDB is used only to remember the `FileSystemFileHandle`/`FileSystemDirectoryHandle` across page reloads (see `src/database/ancestry.service.ts`).

## Commands

- `npm start` — serve the app (`ng serve`, development config).
- `npm run build` — production build (`ng build`).
- `npm run watch` — dev build in watch mode.
- `npm test` — run the full test suite once (`ng test --no-watch --no-progress`, via `@angular/build:unit-test` / Vitest, headless Chromium).
- `npm run lint` — `eslint --fix src` (also runnable as `ng lint`).
- Run a single test file: `npx vitest run src/gedcom/gedcomFamily.spec.ts` (or any other `*.spec.ts` path). Use `npx vitest` (no `run`) for watch mode on one file.
- Formatting is Prettier (`npx prettier --write <files>`); import order is enforced by `@ianvs/prettier-plugin-sort-imports` per the config in `package.json`.

Note: `ng test`/`ng build` require Node >= 22.22.3 (or 24.15.0 / 26.0.0). If the sandboxed Node is older, `eslint`/`prettier` still work directly and should be used to validate changes.

## Architecture

### Two-layer domain model: `GedcomRecord` vs. typed Gedcom objects

Everything under `src/gedcom/` follows the same two-layer pattern:

1. **`gedcomRecord.ts`** — the generic, untyped GEDCOM tree. `parseGedcomRecords(text)` turns raw GEDCOM text into a tree of `GedcomRecord { xref, tag, abstag, value, children }` (handling `CONC`/`CONT` line continuation and level-based nesting). `serializeGedcomRecordToText(record)` does the reverse. `abstag` is the dotted path of tags from the root (e.g. `INDI.BIRT.DATE`), used to look up field metadata.
2. **Typed models** — one file per GEDCOM record type (`gedcomIndividual.ts`, `gedcomFamily.ts`, `gedcomSource.ts`, `gedcomRepository.ts`, `gedcomMultimedia.ts`, `gedcomSubmitter.ts`, plus shared sub-structures `gedcomFact.ts`, `gedcomName.ts`, `gedcomDate.ts`, `gedcomSourceCitation.ts`, `gedcomMultimediaLink.ts`, `gedcomNote.ts`, `gedcomSex.ts`). Each exposes:
   - `newGedcomX(fields)` — construct with defaults.
   - `parseGedcomX(record: GedcomRecord): GedcomX` — convert a generic record into the typed shape, throwing on unexpected structure.
   - `serializeGedcomX(x: GedcomX): GedcomRecord` — convert back.

`gedcomFactMetadata.ts` is the shared table of event/attribute tag metadata (human-readable descriptions, mandatory-value/type flags) for individual and family facts/attributes; `gedcomFact.ts` uses it to parse/serialize both individual and family events generically as `GedcomFact`.

`src/util/record-unparsed-records.ts`'s `reportUnparsedRecord` is called from every parser's `default` switch case — any GEDCOM tag not explicitly handled gets logged rather than silently dropped or throwing, so unusual/foreign GEDCOM extensions don't crash the app.

### `GedcomDatabase` — the whole file in memory

`src/gedcom/gedcomDatabase.ts` aggregates all records into one `GedcomDatabase` object: `Record<xref, T>` maps for `individuals`, `families`, `sources`, `repositories`, `multimedias`, `submitters`. `parseGedcomDatabase(records)` builds this and then cross-validates bidirectional references (e.g. a family's `husbandXref`/`wifeXref`/`childXrefs` must be mirrored by the corresponding individual's `parentOfFamilyXrefs`/`childOfFamilyXrefs`) — mismatches throw.

Round-tripping is diff-based, not a full re-serialize: `compareGedcomDatabase(originalRecords, updatedDatabase)` hashes every original record by `"tag xref value"` and matches it against freshly serialized records from the updated database, so `serializeGedcomDatabase` only writes what's needed to reconcile the two, preserving original record identity/order where unchanged. `AncestryService.updateGedcomDatabase()` uses this to write the diffed text back to the on-disk file via the `FileSystemFileHandle` writable stream.

### `AncestryService` (`src/database/ancestry.service.ts`)

The single source of truth for app state, injected wherever the current database is needed:
- Holds the `FileSystemFileHandle`/`FileSystemDirectoryHandle` (persisted in Dexie so permission grants survive reloads — the File System Access API requires re-requesting permission each session via `requestPermissions()`).
- `gedcomResource` (an Angular `resource()`) loads and parses the GEDCOM file; `ancestryDatabase` is a `computed()` signal derived from it.
- `ancestryDatabaseResolver` (a route `ResolveFn`) waits for the resource to finish loading and redirects to `/hello` if no database is open yet — used on nearly every route in `app.routes.ts`.
- Mutations go through `updateGedcomDatabase()`, which diffs and writes, then reloads the resource.

### Component structure

Routes/components come in list/detail pairs per record type — e.g. `individuals/` + `individual/`, `sources/` + `source/`, `repositories/` + `repository/`, `families/` + `family/`. Detail components typically:
- Take `ancestryDatabase` (or `xref`, resolving via `AncestryService` directly) as an `input`.
- Derive a `vm` via `computed()` for the template.
- Render an events table (`app-events-table`, shared between individual and family facts via the `owner: "individual" | "family"` input) and the raw record via `app-gedcom-display` (serializes the entity back to `GedcomRecord` text for display).
- Offer an edit affordance via `app-gedcom-editor-dialog` (wraps `app-gedcom-editor`, one shared form-based editor keyed by `type: "INDI" | "SOUR" | "OBJE" | "REPO"` — note families are not yet editable through this dialog).

Cross-links between individuals go through `app-individual-link`, which looks up the individual by xref via `AncestryService` and renders name + link — reuse it rather than writing ad hoc `routerLink`s to `/individual/:xref`.

The editor (`gedcom-editor/`) works on a scratch copy of the `GedcomDatabase` (via `immer`'s `produce`, exposed as a `linkedSignal`) using Angular's experimental signal-forms (`@angular/forms/signals`), and previews the pending change with `app-gedcom-diff` before committing through `AncestryService`.

### Routing

`app.routes.ts` defines flat list/detail routes for each record type, all guarded by `ancestryDatabaseResolver`. `NoRouteReuseStrategy` (`src/app/no-reuse-route-strategy.ts`) disables Angular's default route-reuse so that navigating between two detail routes with the same component (e.g. `/individual/@I1@` → `/individual/@I2@`) fully re-initializes the component rather than reusing it.

## Conventions

- Components are `OnPush`-by-default (`@angular-eslint/prefer-on-push-component-change-detection` is an error) and use the new control-flow syntax (`@if`/`@for`), signals, and `computed()` rather than lifecycle hooks/observables where possible.
- Component selectors are `app-` prefixed kebab-case; directive selectors `app` prefixed camelCase (enforced by eslint).
- Tests (`*.spec.ts`) use Vitest. Components with template-driven behavior (event handling, rendered DOM assertions) render via `render()` from `@testing-library/angular/zoneless` with `inputBinding(name, signal(...))` for inputs; simpler smoke tests use `TestBed.createComponent` directly. Match whichever pattern the sibling spec in that directory already uses.
- Parsers (`parseGedcomX`) are strict: they `throw new Error()` on any structurally-unexpected GEDCOM content rather than silently coercing it, and call `reportUnparsedRecord` for any child tag they don't recognize.
