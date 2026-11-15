import {
  DestroyRef,
  Service,
  computed,
  inject,
  resourceFromSnapshots,
} from "@angular/core";
import { rxResource, toObservable } from "@angular/core/rxjs-interop";
import {
  RedirectCommand,
  Router,
  type CanActivateFn,
  type ResourceResult,
} from "@angular/router";
import Dexie, { liveQuery } from "dexie";
import { filter, firstValueFrom, from, switchMap } from "rxjs";

import {
  compareGedcomDatabase,
  newGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabase,
  type GedcomDatabase,
} from "../gedcom/gedcomDatabase";
import {
  gedcomRecordsEqual,
  parseGedcomRecords,
  type GedcomRecord,
} from "../gedcom/gedcomRecord";
import { copyFileToPath, fileExistsAtPath } from "../util/file-system";

export const BUILTIN_GEDCOM_URL = "assets/samples/royal-family.ged";

export type DataSource =
  | { mode: "builtin" }
  | { mode: "gedcom"; gedcomHandle: FileSystemFileHandle }
  | {
      mode: "directory";
      directoryHandle: FileSystemDirectoryHandle;
      gedcomFilename: string;
    };

interface DatabaseState {
  id?: number;
  dataSource?: DataSource;
}

// Older versions of this table stored `gedcomHandle`/`multimediaHandle`
// directly rather than as a `dataSource` union; migrate anyone who has that
// shape already in IndexedDB into the "gedcom" mode (multimedia handles
// stored independently of a directory aren't representable anymore, so they
// are dropped, matching the new gedcom-only vs. directory split).
interface LegacyDatabaseState {
  id?: number;
  gedcomHandle?: FileSystemFileHandle;
  multimediaHandle?: FileSystemDirectoryHandle;
}

class DexieDatabase extends Dexie {
  metadata!: Dexie.Table<DatabaseState, number>;

  constructor() {
    super("AncestryDatabase");
    this.version(5).stores({
      metadata: "++id",
    });
    this.version(6)
      .stores({
        metadata: "++id",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<LegacyDatabaseState, number>("metadata")
          .toCollection()
          .modify((state) => {
            const legacy = state as DatabaseState & LegacyDatabaseState;
            if (legacy.gedcomHandle !== undefined) {
              legacy.dataSource = {
                mode: "gedcom",
                gedcomHandle: legacy.gedcomHandle,
              };
            }
            delete legacy.gedcomHandle;
            delete legacy.multimediaHandle;
          });
      });
  }
}

/** The loaded GEDCOM file. gedcomResource's value is undefined instead
 * when no data source is stored. */
export interface GedcomResourceValue {
  dataSource: DataSource;
  gedcomFileHandle: FileSystemFileHandle | undefined;
  gedcomFile: File | undefined;
  gedcomText: string;
  gedcomRecords: GedcomRecord[];
  gedcomDatabase: GedcomDatabase;
  directoryHandle: FileSystemDirectoryHandle | undefined;
}

export function newGedcomResourceValue(
  fieldsToUpdate: Partial<GedcomResourceValue> = {},
): GedcomResourceValue {
  return {
    dataSource: { mode: "builtin" },
    gedcomFileHandle: undefined,
    gedcomFile: undefined,
    gedcomText: "",
    gedcomRecords: [],
    gedcomDatabase: newGedcomDatabase(),
    directoryHandle: undefined,
    ...fieldsToUpdate,
  };
}

async function loadGedcom(
  dataSource: DataSource | undefined,
): Promise<GedcomResourceValue | undefined> {
  if (dataSource === undefined) {
    return undefined;
  }

  if (dataSource.mode === "builtin") {
    const response = await fetch(BUILTIN_GEDCOM_URL);
    const gedcomText = await response.text();
    const gedcomRecords = parseGedcomRecords(gedcomText);
    return {
      dataSource,
      gedcomFileHandle: undefined,
      gedcomFile: undefined,
      gedcomText,
      gedcomRecords,
      gedcomDatabase: parseGedcomDatabase(gedcomRecords),
      directoryHandle: undefined,
    };
  }

  const gedcomFileHandle =
    dataSource.mode === "gedcom"
      ? dataSource.gedcomHandle
      : await dataSource.directoryHandle.getFileHandle(
          dataSource.gedcomFilename,
        );
  const directoryHandle =
    dataSource.mode === "directory" ? dataSource.directoryHandle : undefined;

  const gedcomFile = await gedcomFileHandle.getFile();
  const gedcomText = await gedcomFile.text();
  const gedcomRecords = parseGedcomRecords(gedcomText);

  return {
    dataSource,
    gedcomFileHandle,
    gedcomFile,
    gedcomText,
    gedcomRecords,
    gedcomDatabase: parseGedcomDatabase(gedcomRecords),
    directoryHandle,
  };
}

export async function findGedcomFilenames(
  directoryHandle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const filenames: string[] = [];
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === "file" && name.toLowerCase().endsWith(".ged")) {
      filenames.push(name);
    }
  }
  return filenames.sort();
}

@Service()
export class AncestryService {
  readonly dexieDatabase = new DexieDatabase();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      // Dexie opens its IndexedDB connection lazily and never closes it on
      // its own. Without this, every AncestryService instance (e.g. one per
      // unit test) leaves its IndexedDB connection open indefinitely, and
      // they accumulate for the life of the page.
      this.dexieDatabase.close();
    });
  }

  // Reloads whenever the metadata row changes -- including changes made by
  // this service's own writes, since Dexie's liveQuery tracks exactly which
  // tables/queries a write affects and re-queries automatically, without
  // needing every writer to manually signal that something changed.
  //
  // Built from the liveQuery observable directly (via switchMap) rather
  // than a signal, since a signal needs a synchronous initial value and
  // liveQuery's first emission is always asynchronous -- there's no
  // meaningful placeholder to give it that isn't indistinguishable from
  // "read IndexedDB, and there's genuinely no data source configured".
  // Driving the resource straight off the observable means it just stays
  // loading, correctly, until that first real read comes back.
  readonly gedcomResource = rxResource({
    stream: () =>
      from(liveQuery(() => this.dexieDatabase.metadata.get(1))).pipe(
        switchMap((metadata) => loadGedcom(metadata?.dataSource)),
      ),
  });

  readonly ancestryDatabase = computed<GedcomDatabase | undefined>(
    () => this.gedcomResource.value()?.gedcomDatabase,
  );

  /** The parsed database, as a Resource of its own: the router binds a
   * resource's value to the input with the same name (see
   * ancestryDatabaseResources), so the route needs a resource whose value
   * is the database itself rather than gedcomResource's whole value.
   * resourceFromSnapshots derives it from gedcomResource's state; the
   * router's ResourceResult type also asks for reload(). */
  readonly ancestryDatabaseResource = Object.assign(
    resourceFromSnapshots(() => {
      const snapshot = this.gedcomResource.snapshot();
      if (snapshot.status === "error") return snapshot;
      return { status: snapshot.status, value: snapshot.value?.gedcomDatabase };
    }),
    { reload: () => this.gedcomResource.reload() },
  );

  compareGedcomDatabase(gedcomDatabase: GedcomDatabase): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    return compareGedcomDatabase(
      this.gedcomResource.value()?.gedcomRecords ?? [],
      this.ancestryDatabase() ?? newGedcomDatabase(),
      gedcomDatabase,
    );
  }

  /** The records that would actually change on disk if `gedcomDatabase`
   * were saved: compareGedcomDatabase()'s pairs, the same diff the save
   * path writes from, minus those that would be written exactly as they
   * are in the file. A record whose xref is in `alwaysIncludeXrefs` is
   * listed even when unchanged. */
  gedcomDatabaseDifferences(
    gedcomDatabase: GedcomDatabase,
    alwaysIncludeXrefs: ReadonlySet<string> = new Set(),
  ): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    return this.compareGedcomDatabase(gedcomDatabase).filter(
      ({ originalGedcomRecord, updatedGedcomRecord }) => {
        const xref = originalGedcomRecord?.xref ?? updatedGedcomRecord?.xref;
        return (
          (xref != undefined && alwaysIncludeXrefs.has(xref)) ||
          originalGedcomRecord == undefined ||
          updatedGedcomRecord == undefined ||
          !gedcomRecordsEqual(originalGedcomRecord, updatedGedcomRecord)
        );
      },
    );
  }

  async updateGedcomDatabase(gedcomDatabase: GedcomDatabase) {
    const gedcomResource = this.gedcomResource.value();
    const originalGedcomRecords = gedcomResource?.gedcomRecords ?? [];
    const originalGedcomDatabase =
      this.ancestryDatabase() ?? newGedcomDatabase();
    const text = serializeGedcomDatabase(
      originalGedcomRecords,
      originalGedcomDatabase,
      gedcomDatabase,
    );

    const gedcomFileHandle = this.gedcomResource.value()?.gedcomFileHandle;
    if (gedcomFileHandle == undefined) {
      throw new Error("No GEDCOM file handle available");
    }

    const writableStream = await gedcomFileHandle.createWritable();
    await writableStream.write(text.join("\n"));
    await writableStream.write("\n");
    await writableStream.close();
    this.gedcomResource.reload();
  }

  private async setDataSource(dataSource: DataSource) {
    await this.dexieDatabase.transaction(
      "rw",
      this.dexieDatabase.metadata,
      async () => {
        // Upsert logic for singleton
        const metadata = (await this.dexieDatabase.metadata.get(1)) ?? {
          id: 1,
        };
        metadata.dataSource = dataSource;
        await this.dexieDatabase.metadata.put(metadata);
      },
    );
  }

  async openBuiltin() {
    await this.setDataSource({ mode: "builtin" });
  }

  async openGedcom(gedcomHandle: FileSystemFileHandle) {
    await this.setDataSource({ mode: "gedcom", gedcomHandle });
  }

  async openDirectory(
    directoryHandle: FileSystemDirectoryHandle,
    gedcomFilename: string,
  ) {
    await this.setDataSource({
      mode: "directory",
      directoryHandle,
      gedcomFilename,
    });
  }

  async clearDatabase() {
    await this.dexieDatabase.transaction(
      "rw",
      this.dexieDatabase.metadata,
      async () => {
        await this.dexieDatabase.metadata.clear();
      },
    );
  }

  // Whether something already exists at `relativePath` in the loaded
  // directory.
  async multimediaFileExists(relativePath: string): Promise<boolean> {
    const directoryHandle = this.gedcomResource.value()?.directoryHandle;
    return directoryHandle
      ? fileExistsAtPath(directoryHandle, relativePath)
      : false;
  }

  // Copies `file` to `relativePath` in the loaded directory, never
  // overwriting (see copyFileToPath).
  async copyMultimediaFile(file: File, relativePath: string): Promise<void> {
    const directoryHandle = this.gedcomResource.value()?.directoryHandle;
    if (!directoryHandle) {
      throw new Error("No directory loaded");
    }
    await copyFileToPath(directoryHandle, file, relativePath);
  }

  async requestPermissions() {
    const dataSource = (await this.dexieDatabase.metadata.get(1))?.dataSource;
    if (dataSource?.mode === "gedcom") {
      await dataSource.gedcomHandle.requestPermission();
    } else if (dataSource?.mode === "directory") {
      await dataSource.directoryHandle.requestPermission();
    }

    this.gedcomResource.reload();
  }

  // Upgrades to write access on the loaded GEDCOM file, prompting the user
  // if needed. Settings only ever requests read access, so this is called
  // when the user actually starts editing (opening the GEDCOM editor
  // dialog) rather than up front. Returns whether write access is granted;
  // there's nothing to upgrade in "builtin" mode, since that data isn't
  // backed by a real file.
  async requestWritePermission(): Promise<boolean> {
    const dataSource = (await this.dexieDatabase.metadata.get(1))?.dataSource;
    const handle =
      dataSource?.mode === "gedcom"
        ? dataSource.gedcomHandle
        : dataSource?.mode === "directory"
          ? dataSource.directoryHandle
          : undefined;
    if (handle === undefined) {
      return false;
    }

    const permission = await handle.requestPermission({ mode: "readwrite" });
    return permission === "granted";
  }
}

/** Keeps the data routes away until a GEDCOM file is loaded, sending the
 * user to /settings to pick one if there's none. */
export const ancestryDatabaseGuard: CanActivateFn = async () => {
  const ancestryService = inject(AncestryService);
  const router = inject(Router);

  await firstValueFrom(
    toObservable(ancestryService.gedcomResource.isLoading).pipe(
      filter((isLoading) => !isLoading),
    ),
  );
  if (ancestryService.ancestryDatabase() === undefined) {
    return new RedirectCommand(router.parseUrl("/settings"));
  }
  return true;
};

/** A data route's `resources`, binding gedcomResource itself to a
 * `gedcom` input: the page gets the whole loaded file (handles, records
 * and parsed database) and reads `gedcomDatabase` from it. Only the
 * individuals and individual pages use this so far. */
export function gedcomResources(): ResourceResult {
  return { gedcom: inject(AncestryService).gedcomResource };
}

/** A data route's `resources`: binds its component's `ancestryDatabase`
 * input to the loaded database, which then follows every reload of the
 * file, so saving an edit needs no navigation to refresh the page. */
export function ancestryDatabaseResources(): ResourceResult {
  return {
    ancestryDatabase: inject(AncestryService).ancestryDatabaseResource,
  };
}
