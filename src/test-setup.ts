import "fake-indexeddb/auto";
import { Dexie } from "dexie";
import { beforeEach } from "vitest";

beforeEach(async () => {
  for (const databaseName of await Dexie.getDatabaseNames()) {
    await Dexie.delete(databaseName);
  }
});
