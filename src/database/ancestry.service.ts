import { DestroyRef, Service, effect, inject } from "@angular/core";
import {
  rxResource,
  takeUntilDestroyed,
  toObservable,
} from "@angular/core/rxjs-interop";
import {
  RedirectCommand,
  Router,
  type CanActivateFn,
  type ResourceResult,
} from "@angular/router";
import Dexie, { liveQuery } from "dexie";
import {
  filter,
  firstValueFrom,
  from,
  fromEvent,
  merge,
  switchMap,
} from "rxjs";

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

// The File System Observer API isn't in TypeScript's DOM types yet, nor in
// @types/wicg-file-system-access. Only what this file uses.
declare class FileSystemObserver {
  constructor(callback: () => void);
  observe(handle: FileSystemHandle): Promise<void>;
  disconnect(): void;
}

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
  // The person relationships are described from, chosen in settings. Kept
  // here in the browser only, never written to the GEDCOM file.
  rootIndividualXref?: string;
}

class DexieDatabase extends Dexie {
  metadata!: Dexie.Table<DatabaseState, number>;

  constructor() {
    super("AncestryDatabase");
    this.version(6).stores({
      metadata: "++id",
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
  // The person relationships are described from, chosen in settings. It
  // may name someone who isn't in the file.
  rootIndividualXref: string | undefined;
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
    rootIndividualXref: undefined,
    ...fieldsToUpdate,
  };
}

async function loadGedcom(
  metadata: DatabaseState | undefined,
): Promise<GedcomResourceValue | undefined> {
  const dataSource = metadata?.dataSource;
  const rootIndividualXref = metadata?.rootIndividualXref;
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
      rootIndividualXref,
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
    rootIndividualXref,
  };
}

/** Thrown by AncestryService.updateGedcomDatabase() when the file on disk
 * no longer matches what was loaded, so saving would overwrite someone
 * else's changes. Nothing is written. */
export class GedcomFileChangedError extends Error {
  constructor() {
    super(
      "The GEDCOM file was changed after this page loaded it, maybe by " +
        "another tab. Nothing was saved, so those changes are safe. " +
        "Reload the page to get the latest version, then make your edit " +
        "again.",
    );
    this.name = "GedcomFileChangedError";
  }
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

/** A BroadcastChannel that calls `onMessage` for each message from another
 * tab, closed when the current injection context is destroyed. */
function injectBroadcastChannel(
  name: string,
  onMessage: () => void,
): BroadcastChannel {
  const channel = new BroadcastChannel(name);
  channel.onmessage = onMessage;
  inject(DestroyRef).onDestroy(() => {
    channel.close();
  });
  return channel;
}

@Service()
export class AncestryService {
  readonly dexieDatabase = new DexieDatabase();

  // Tells this app's other tabs (same origin) that the GEDCOM file was just
  // saved, so they reload it instead of showing, and later saving over, a
  // stale copy. A tab doesn't receive its own messages.
  private readonly savedChannel = injectBroadcastChannel(
    "ancestry-gedcom-saved",
    () => {
      this.gedcomResource.reload();
    },
  );

  constructor() {
    // Another program can change the file too, and it can't tell us over
    // savedChannel. Watch the file where the browser supports it, and
    // re-check whenever the user comes back to this tab.
    effect((onCleanup) => {
      const handle = this.gedcomResource.value()?.gedcomFileHandle;
      if (handle === undefined || typeof FileSystemObserver === "undefined") {
        return;
      }
      const observer = new FileSystemObserver(() => {
        void this.reloadIfFileChanged();
      });
      // Watching is a convenience: if it fails, the focus and save-time
      // checks still catch the change.
      Promise.resolve()
        .then(() => observer.observe(handle))
        .catch((error: unknown) => {
          console.error(error);
        });
      onCleanup(() => {
        observer.disconnect();
      });
    });
    merge(fromEvent(window, "focus"), fromEvent(document, "visibilitychange"))
      .pipe(
        filter(() => document.visibilityState === "visible"),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        void this.reloadIfFileChanged();
      });

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
        switchMap((metadata) => loadGedcom(metadata)),
      ),
  });

  private readonly isLoading$ = toObservable(this.gedcomResource.isLoading);

  /** Reloads the GEDCOM file if it changed on disk since it was loaded,
   * e.g. saved by another program, and resolves once that reload is done.
   * Cheap when it hasn't changed: it compares the file's size and
   * modification time, without reading it. */
  async reloadIfFileChanged(): Promise<void> {
    // A reload already under way (e.g. after our own save) picks up the
    // change anyway.
    if (this.gedcomResource.isLoading()) return;
    const loaded = this.gedcomResource.value();
    if (loaded?.gedcomFileHandle === undefined) return;
    const loadedFile = loaded.gedcomFile;
    let changed: boolean;
    try {
      const current = await loaded.gedcomFileHandle.getFile();
      changed =
        current.lastModified !== loadedFile?.lastModified ||
        current.size !== loadedFile.size;
    } catch {
      // Gone or no longer readable: reloading reports that properly.
      changed = true;
    }
    if (!changed || this.gedcomResource.value() !== loaded) return;
    this.gedcomResource.reload();
    if (this.gedcomResource.isLoading()) {
      // defaultValue: the service may be destroyed (completing isLoading$)
      // before the reload finishes, e.g. at the end of a test.
      await firstValueFrom(
        this.isLoading$.pipe(filter((isLoading) => !isLoading)),
        { defaultValue: false },
      );
    }
  }

  compareGedcomDatabase(gedcomDatabase: GedcomDatabase): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    return compareGedcomDatabase(
      this.gedcomResource.value()?.gedcomRecords ?? [],
      this.gedcomResource.value()?.gedcomDatabase ?? newGedcomDatabase(),
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

  /** Saves `gedcomDatabase`, an edit of the loaded database. Throws
   * GedcomFileChangedError, writing nothing, if the file on disk no longer
   * matches what was loaded (another tab or program saved it since):
   * writing anyway would silently throw those changes away. */
  async updateGedcomDatabase(gedcomDatabase: GedcomDatabase) {
    const gedcomResource = this.gedcomResource.value();
    if (gedcomResource?.gedcomFileHandle == undefined) {
      throw new Error("No GEDCOM file handle available");
    }
    const currentFile = await gedcomResource.gedcomFileHandle.getFile();
    if ((await currentFile.text()) !== gedcomResource.gedcomText) {
      // Show the newer file.
      this.gedcomResource.reload();
      throw new GedcomFileChangedError();
    }

    const text = serializeGedcomDatabase(
      gedcomResource.gedcomRecords,
      gedcomResource.gedcomDatabase,
      gedcomDatabase,
    );
    const writableStream =
      await gedcomResource.gedcomFileHandle.createWritable();
    await writableStream.write(text.join("\n"));
    await writableStream.write("\n");
    await writableStream.close();
    this.savedChannel.postMessage("saved");
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
        // A root person picked in another file means nothing in this one.
        delete metadata.rootIndividualXref;
        await this.dexieDatabase.metadata.put(metadata);
      },
    );
  }

  async setRootIndividualXref(rootIndividualXref: string | undefined) {
    await this.dexieDatabase.metadata.update(1, { rootIndividualXref });
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
  if (ancestryService.gedcomResource.value() === undefined) {
    return new RedirectCommand(router.parseUrl("/settings"));
  }
  return true;
};

/** A data route's `resources`, binding gedcomResource to the page's
 * `gedcom` input: the page gets the whole loaded file (handles, records
 * and parsed database) and reads `gedcomDatabase` from it. The router keeps
 * the input in step with the resource, so a save's reload reaches the page
 * in the same render as everything else, with no navigation. */
export function gedcomResources(): ResourceResult {
  return { gedcom: inject(AncestryService).gedcomResource };
}
