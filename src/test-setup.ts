import { Dexie } from "dexie";
import { setAutoFreeze } from "immer";
import { beforeEach } from "vitest";

// Match src/main.ts: don't use Object.freeze on immer produced objects, to
// preserve compatibility with Angular. main.ts never runs under Vitest (specs
// render components directly, bypassing the app's bootstrap), so without
// this, immer's dev-mode autoFreeze default deep-freezes every produce()d
// GedcomDatabase and Angular Signal Forms throws trying to attach its own
// tracking Symbol() onto those frozen objects when building the field tree.
setAutoFreeze(false);

// Delete all files in the the Origin Local File System between tests.
beforeEach(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const name of root.keys()) {
    await root.removeEntry(name, { recursive: true });
  }
});

// Delete all dexie databases between tests.
beforeEach(async () => {
  for (const databaseName of await Dexie.getDatabaseNames()) {
    await Dexie.delete(databaseName);
  }
});
