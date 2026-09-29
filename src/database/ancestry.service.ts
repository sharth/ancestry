import { DestroyRef, Service, computed, inject } from "@angular/core";
import { rxResource, toObservable } from "@angular/core/rxjs-interop";
import { RedirectCommand, Router, type ResolveFn } from "@angular/router";
import Dexie, { liveQuery } from "dexie";
import { filter, firstValueFrom, from, switchMap } from "rxjs";

import {
  compareGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabase,
  type GedcomDatabase,
} from "../gedcom/gedcomDatabase";
import { parseGedcomRecords, type GedcomRecord } from "../gedcom/gedcomRecord";

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

interface GedcomResourceValue {
  dataSource: DataSource | undefined;
  gedcomFileHandle: FileSystemFileHandle | undefined;
  gedcomFile: File | undefined;
  gedcomText: string | undefined;
  gedcomRecords: GedcomRecord[];
  directoryHandle: FileSystemDirectoryHandle | undefined;
}

async function loadGedcom(
  dataSource: DataSource | undefined,
): Promise<GedcomResourceValue> {
  if (dataSource === undefined) {
    return {
      dataSource: undefined,
      gedcomFileHandle: undefined,
      gedcomFile: undefined,
      gedcomText: undefined,
      gedcomRecords: [],
      directoryHandle: undefined,
    };
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

  // Combined into one computed (rather than two separate ones each calling
  // parseGedcomDatabase) so a parse failure -- which is data-dependent, not
  // a bug, e.g. a GEDCOM file with a dangling FAM/INDI cross reference --
  // is only ever computed once and both the database and the error stay in
  // sync with each other.
  private readonly ancestryDatabaseResult = computed<
    { database: GedcomDatabase; error: undefined } | { database: undefined; error: Error | undefined }
  >(() => {
    const gedcomResourceValue = this.gedcomResource.value();
    if (
      gedcomResourceValue === undefined ||
      gedcomResourceValue.gedcomRecords.length === 0
    ) {
      return { database: undefined, error: undefined };
    }

    try {
      return {
        database: parseGedcomDatabase(gedcomResourceValue.gedcomRecords),
        error: undefined,
      };
    } catch (error) {
      return {
        database: undefined,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  });

  readonly ancestryDatabase = computed<GedcomDatabase | undefined>(
    () => this.ancestryDatabaseResult().database,
  );

  // Set when the currently loaded GEDCOM file failed to parse (e.g. it has
  // a referential-integrity problem parseGedcomDatabase caught) -- as
  // opposed to ancestryDatabase() simply being undefined because no data
  // source is loaded yet. The settings page surfaces this to the user
  // instead of silently bouncing them back to /settings with no
  // explanation (which is what used to happen: ancestryDatabaseResolver
  // read ancestryDatabase() directly, so a parse error there threw out of
  // the resolver uncaught and aborted the navigation).
  readonly ancestryDatabaseError = computed<Error | undefined>(
    () => this.ancestryDatabaseResult().error,
  );

  compareGedcomDatabase(gedcomDatabase: GedcomDatabase): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    return compareGedcomDatabase(
      this.gedcomResource.value()?.gedcomRecords ?? [],
      gedcomDatabase,
    );
  }

  async updateGedcomDatabase(gedcomDatabase: GedcomDatabase) {
    const gedcomResource = this.gedcomResource.value();
    const originalGedcomRecords = gedcomResource?.gedcomRecords ?? [];
    const text = serializeGedcomDatabase(originalGedcomRecords, gedcomDatabase);

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

  // Resolves a multimedia path (as stored in a GEDCOM OBJE.FILE value, using
  // forward or backward slashes) to a file handle within the currently
  // loaded directory. Returns undefined if no directory is loaded, or if the
  // path doesn't resolve to a file within it.
  async getMultimediaFileHandle(
    relativePath: string,
  ): Promise<FileSystemFileHandle | undefined> {
    let directoryHandle = this.gedcomResource.value()?.directoryHandle;
    if (!directoryHandle) {
      return undefined;
    }

    const pathParts = relativePath
      .split(/[/\\]/)
      .filter((part) => part.length > 0);
    const fileName = pathParts.at(-1);
    if (fileName === undefined) {
      return undefined;
    }

    for (const part of pathParts.slice(0, -1)) {
      directoryHandle = await directoryHandle.getDirectoryHandle(part);
    }
    return directoryHandle.getFileHandle(fileName);
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

export const ancestryDatabaseResolver: ResolveFn<
  GedcomDatabase | RedirectCommand
> = async () => {
  const ancestryService = inject(AncestryService);
  const router = inject(Router);

  await firstValueFrom(
    toObservable(ancestryService.gedcomResource.isLoading).pipe(
      filter((isLoading) => !isLoading),
    ),
  );
  const database = ancestryService.ancestryDatabase();
  if (database === undefined) {
    return new RedirectCommand(router.parseUrl("/settings"));
  }
  return database;
};
