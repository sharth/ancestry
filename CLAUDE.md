# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm start              # ng serve (development config), dev server with HMR
npm run build           # ng build (production)
npm run watch           # ng build --watch (development config)
npm test                # ng test --no-watch --no-progress (vitest, runs in a real browser)
npm run lint             # eslint --fix src
```

Requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (see `@angular/core`'s `engines` field) — a slightly older
Node 22.x will fail with a version-check error before the CLI does anything.

### Running a single test / filtering

```sh
ng test --include "src/app/individual/individual.component.spec.ts"
ng test --filter "IndividualComponent"
```

### Sandboxed environments without `chrome-headless-shell`

The test suite runs in Browser Mode (`@vitest/browser-playwright`), which by default launches the
`chrome-headless-shell` Playwright variant. Some sandboxes only have a plain `chromium` binary
pre-installed. If `npm test` fails with `Executable doesn't exist at .../chromium_headless_shell-*`,
point it at the installed binary instead of downloading anything:

```sh
CHROME_BIN=/opt/pw-browsers/chromium npm test
```

`@angular/build`'s vitest runner reads `CHROME_BIN` directly (`browser-provider.js`) and swaps it into
the `chromium`/`chrome` instance's `launchOptions.executablePath` — no `vitest.config.ts` changes needed.
If results look stale after this, clear `node_modules/.vite .angular/cache .vitest .vitest-attachments`
first.

Screenshot-based tests (`toMatchScreenshot()`) compare against baseline PNGs committed under
`.vitest-screenshots/`. A baseline generated against plain `chromium` instead of `chrome-headless-shell`
can differ slightly in font rasterization from what real CI produces.

## Architecture

This is an Angular 22 (zoneless, standalone components) single-page app for browsing and editing GEDCOM
genealogy files, entirely client-side — there is no backend. It's built from three layers:

### 1. GEDCOM parsing (`src/gedcom/`)

`gedcomRecord.ts` parses raw GEDCOM text into a generic `level`/`tag`/`value` tree (`GedcomRecord`), with
no knowledge of what any tag means. Every other file in this directory is one GEDCOM entity (individual,
family, source, source citation, multimedia, repository, name, sex, fact/event, etc.) and follows the same
triad:

- `newGedcomX(fields)` — construct with defaults
- `parseGedcomX(record: GedcomRecord): GedcomX` — validate and convert from the generic tree
- `serializeGedcomX(x: GedcomX): GedcomRecord` — convert back

`GedcomRecord.abstag` is the dotted path of ancestor tags (e.g. `INDI.SEX`) used to disambiguate a tag
that means different things at different nesting depths. Parsers are intentionally strict: unexpected
child tags call `reportUnparsedRecord` (`src/util/record-unparsed-records.ts`, warns once per abstag)
rather than silently ignoring or guessing.

`gedcomDatabase.ts` is the top-level entity, indexing individuals/families/sources/repositories/multimedia
by xref. Saving an edit doesn't re-serialize the whole file: `compareGedcomDatabase` diffs the
originally-parsed records against the edited in-memory `GedcomDatabase` by `tag xref value` hash, so
records the app doesn't understand (and therefore can't have parsed into typed fields) round-trip
unchanged. `gedcomFactMetadata.ts` holds per-tag metadata (human-readable descriptions, whether a value is
mandatory) used by facts/events across individuals and families.

### 2. Data loading (`src/database/ancestry.service.ts`)

There's no upload step — `AncestryService` stores a `FileSystemFileHandle`/`FileSystemDirectoryHandle`
(File System Access API) for the GEDCOM file and multimedia directory in IndexedDB via Dexie, and re-reads
the live file from disk through an Angular `resource()` whenever `ancestryChanges` (bumped by Dexie's
`storagemutated` event) changes. `ancestryDatabaseResolver` is a route resolver used on every data-bearing
route; it waits for the resource to settle and redirects to `/hello` if no GEDCOM file is loaded yet.

### 3. Routing and components (`src/app/`)

Routes are configured with `withComponentInputBinding()` (`app.config.ts`), so route params and resolved
data (`ancestryDatabase`, `xref`) bind directly to matching `input.required<...>()` properties — including
on nested child routes, without each child re-declaring its own resolver, as long as its own route segment
resolves/declares the same data key (see `individual/:xref` and `family/:xref` in `app.routes.ts`).

Detail pages for individuals and families both follow the same shape: a parent component renders the
identity info that's always visible (name, members, etc.) plus a Bootstrap `nav-tabs` bar and a
`<router-outlet>`, and each tab (Facts, Ancestors, Sources, Gedcom) is a separate routed child component
reading the same `ancestryDatabase`/`xref` inputs. `NoRouteReuseStrategy` (`app.config.ts`) forces every
navigation, including between these tabs, to destroy and recreate the target component rather than reuse
an existing instance.

UI is plain Bootstrap (classes + `bootstrap-icons`), not a component library — there's no Angular Material
or similar; use `<table class="table table-striped">`, `btn`/`card`/`container` classes, etc. to match the
rest of the app.

### Testing

Specs use `@testing-library/angular/zoneless` (`render()`) with `@angular/core`'s zoneless testing bindings
(`inputBinding`), not TestBed directly. Tests genuinely run in a browser (Playwright), so router tests can
use a real `provideRouter(...)` + `withComponentInputBinding()` and navigate with an injected `Router`,
rather than needing a router testing double.
