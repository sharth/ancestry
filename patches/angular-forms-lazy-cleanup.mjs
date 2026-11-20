// Works around https://github.com/angular/angular/issues/70627 until the
// fix (https://github.com/angular/angular/pull/71659) is released.
//
// Signal Forms only creates a field node when something asks for it, but its
// cleanup effect walks the tree with `children()`, which creates every
// child. With `form(workingDatabase)` in the editor, that builds a node for
// every record, fact, date and name in the file: the royal-family sample
// grows the tab to ~4 GB and crashes it. Walking `materializedChildren()`
// visits the same nodes the sweep can clean up, without creating new ones.
//
// Runs as `postinstall`. Once the installed @angular/forms has the fix, this
// fails loudly so we remember to delete it.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const file = join(
  dirname(require.resolve("@angular/forms/package.json")),
  "fesm2022/_validation_errors-chunk.mjs",
);

const before =
  "    for (const child of structure.children()) {\n" +
  "      this.markStructuresLive(child.structure, liveStructures);";
const after =
  "    for (const child of structure.materializedChildren()) {\n" +
  "      this.markStructuresLive(child.structure, liveStructures);";

const source = readFileSync(file, "utf8");
if (source.includes(after)) {
  // Already patched (postinstall ran twice), nothing to do.
} else if (source.includes(before)) {
  writeFileSync(file, source.replace(before, after));
} else {
  throw new Error(
    `${file} no longer contains the markStructuresLive loop this patch ` +
      `replaces. If angular/angular#70627 is fixed, delete ` +
      `patches/angular-forms-lazy-cleanup.mjs and its postinstall script.`,
  );
}
