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
import type { GedcomRecord} from "../gedcom/gedcomRecord";
import { parseGedcomRecords } from "../gedcom/gedcomRecord";

interface DatabaseState {
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
  }
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
      const gedcomFileHandle = metadata?.gedcomHandle;
      const directoryHandle = metadata?.multimediaHandle;

      if (gedcomFileHandle == undefined) {
        return {
          gedcomFileHandle: undefined,
          gedcomFile: undefined,
          gedcomText: undefined,
          gedcomRecords: [],
          directoryHandle,
        };
      }

      const gedcomFile = await gedcomFileHandle.getFile();
      const gedcomText = await gedcomFile.text();
      const gedcomRecords = parseGedcomRecords(gedcomText);

      return {
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

  async openGedcom() {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Gedcom",
          accept: {
            "text/plain": [".ged"],
          },
        },
      ],
    });
    await this.dexieDatabase.transaction(
      "rw",
      this.dexieDatabase.metadata,
      async () => {
        // Upsert logic for singleton
        const metadata = (await this.dexieDatabase.metadata.get(1)) ?? {
          id: 1,
        };
        metadata.gedcomHandle = fileHandle;
        await this.dexieDatabase.metadata.put(metadata);
      },
    );
    console.log("Parsing complete");
  }

  async openMultimedia() {
    const directoryHandle = await window.showDirectoryPicker({
      id: "multimedia",
      mode: "read",
    });
    await this.dexieDatabase.transaction(
      "rw",
      this.dexieDatabase.metadata,
      async () => {
        const metadata = (await this.dexieDatabase.metadata.get(1)) ?? {
          id: 1,
        };
        metadata.multimediaHandle = directoryHandle;
        await this.dexieDatabase.metadata.put(metadata);
      },
    );
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

  async requestPermissions() {
    const metadata = await this.dexieDatabase.metadata.get(1);
    await metadata?.gedcomHandle?.requestPermission();
    await metadata?.multimediaHandle?.requestPermission();

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
    return new RedirectCommand(router.parseUrl("/hello"));
  }
  return database;
};
