import { Dexie } from "dexie";
import { beforeEach } from "vitest";

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
