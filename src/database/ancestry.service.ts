import { Service, computed, inject, resource, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { RedirectCommand, Router, type ResolveFn } from "@angular/router";
import Dexie from "dexie";
import { filter, firstValueFrom } from "rxjs";
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

  // A signal that increments every time the Dexie / IndexedDB database changes.
  // This can be used in the request field for an Angular Resource.
  readonly ancestryChanges = signal(0);

  constructor() {
    Dexie.on("storagemutated", () => {
      console.log("Dexie database mutated");
      this.ancestryChanges.update((value) => value + 1);
    });
  }

  readonly gedcomResource = resource({
    params: () => ({
      changeCount: this.ancestryChanges(),
    }),
    loader: async () => {
      const metadata = await this.dexieDatabase.metadata.get(1);
      const dataSource = metadata?.dataSource;

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
    },
  });

  readonly ancestryDatabase = computed<GedcomDatabase | undefined>(() => {
    const gedcomResourceValue = this.gedcomResource.value();
    if (
      gedcomResourceValue === undefined ||
      gedcomResourceValue.gedcomRecords.length === 0
    ) {
      return undefined;
    }

    return parseGedcomDatabase(gedcomResourceValue.gedcomRecords);
  });

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
