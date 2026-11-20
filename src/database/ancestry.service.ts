import { DestroyRef, Service, inject } from "@angular/core";
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
  newGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabase,
  type GedcomDatabase,
} from "../gedcom/gedcomDatabase";
import { parseGedcomRecords, type GedcomRecord } from "../gedcom/gedcomRecord";
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
  // The person relationships are described from, chosen in settings. Kept
  // here in the browser only, never written to the GEDCOM file.
  rootIndividualXref?: string;
}

/** A copy of the GEDCOM file as it was just before a save overwrote it,
 * kept so the save can be undone. */
export interface GedcomSave {
  id?: number;
  // When the save that replaced this text happened.
  savedAt: Date;
  // The name of the file the text came from, so each file only lists its
  // own history.
  gedcomFilename: string;
  gedcomText: string;
}

class DexieDatabase extends Dexie {
  metadata!: Dexie.Table<DatabaseState, number>;
  saves!: Dexie.Table<GedcomSave, number>;

  constructor() {
    super("AncestryDatabase");
    this.version(6).stores({
      metadata: "++id",
    });
    this.version(7).stores({
      metadata: "++id",
      saves: "++id, gedcomFilename",
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
        switchMap((metadata) => loadGedcom(metadata)),
      ),
  });

  async updateGedcomDatabase(gedcomDatabase: GedcomDatabase) {
    const gedcomResource = this.gedcomResource.value();
    if (gedcomResource?.gedcomFileHandle == undefined) {
      throw new Error("No GEDCOM file handle available");
    }

    const text = serializeGedcomDatabase(
      gedcomResource.gedcomRecords,
      gedcomResource.gedcomDatabase,
      gedcomDatabase,
    );

    await this.writeGedcomText(text.join("\n") + "\n");
  }

  /** Overwrites the GEDCOM file with an earlier save's text. The file as it
   * is now is kept in the history first, so a restore can be undone too. */
  async restoreGedcomSave(id: number) {
    const save = await this.dexieDatabase.saves.get(id);
    if (save == undefined) {
      throw new Error(`No saved copy with id ${id}`);
    }
    await this.writeGedcomText(save.gedcomText);
  }

  // Writes `text` to the loaded GEDCOM file, first keeping what the file
  // holds now in the save history.
  private async writeGedcomText(text: string) {
    const gedcomFileHandle = this.gedcomResource.value()?.gedcomFileHandle;
    if (gedcomFileHandle == undefined) {
      throw new Error("No GEDCOM file handle available");
    }

    // Read the file again rather than using the loaded text, in case it
    // changed on disk since it was loaded.
    const previousText = await (await gedcomFileHandle.getFile()).text();
    await this.dexieDatabase.saves.add({
      savedAt: new Date(),
      gedcomFilename: gedcomFileHandle.name,
      gedcomText: previousText,
    });

    const writableStream = await gedcomFileHandle.createWritable();
    await writableStream.write(text);
    await writableStream.close();
    this.gedcomResource.reload();
  }

  private async setDataSource(dataSource: DataSource) {
    // Replaces the whole row, so the root person is dropped too: a root
    // person picked in another file means nothing in this one.
    await this.dexieDatabase.metadata.put({ id: 1, dataSource });
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
    await this.dexieDatabase.metadata.clear();
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
