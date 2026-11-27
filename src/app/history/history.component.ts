import { DatePipe, DecimalPipe } from "@angular/common";
import { Component, computed, inject, resource, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { liveQuery } from "dexie";
import { from } from "rxjs";

import {
  AncestryService,
  type GedcomSave,
} from "../../database/ancestry.service";
import {
  gedcomRecordsEqual,
  parseGedcomRecords,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";

/** Pairs up the top-level records of two versions of a file by tag, xref
 * and value (as compareGedcomDatabase does), keeping only the pairs that
 * differ. A record missing from one side is paired with undefined. */
export function differingGedcomRecords(
  oldGedcomRecords: readonly GedcomRecord[],
  newGedcomRecords: readonly GedcomRecord[],
): { oldGedcomRecord?: GedcomRecord; newGedcomRecord?: GedcomRecord }[] {
  const hash = (r: GedcomRecord) => `${r.tag} ${r.xref} ${r.value}`;
  const pairs = new Map<
    string,
    { oldGedcomRecord?: GedcomRecord; newGedcomRecord?: GedcomRecord }
  >();
  for (const oldGedcomRecord of oldGedcomRecords) {
    pairs.set(hash(oldGedcomRecord), { oldGedcomRecord });
  }
  for (const newGedcomRecord of newGedcomRecords) {
    const pair = pairs.get(hash(newGedcomRecord));
    if (pair) {
      pair.newGedcomRecord = newGedcomRecord;
    } else {
      pairs.set(hash(newGedcomRecord), { newGedcomRecord });
    }
  }
  return [...pairs.values()].filter(
    ({ oldGedcomRecord, newGedcomRecord }) =>
      oldGedcomRecord == undefined ||
      newGedcomRecord == undefined ||
      !gedcomRecordsEqual(oldGedcomRecord, newGedcomRecord),
  );
}

@Component({
  selector: "app-history",
  imports: [DatePipe, DecimalPipe, GedcomDiffComponent, RouterLink],
  templateUrl: "./history.component.html",
})
export class HistoryComponent {
  private readonly ancestryService = inject(AncestryService);

  // The GEDCOM file as it is on disk. Read directly rather than through the
  // app's parsed copy, so this page still works (and can restore) after a
  // save leaves the file in a state that fails to parse.
  readonly file = resource({
    loader: async () => {
      const handle = await this.ancestryService.storedGedcomFileHandle();
      if (handle == undefined) return undefined;
      return { name: handle.name, text: await (await handle.getFile()).text() };
    },
  });

  readonly gedcomFilename = computed(() =>
    this.file.hasValue() ? this.file.value().name : undefined,
  );

  // The current file's records, or undefined if even its lines can't be
  // read as GEDCOM.
  readonly currentGedcomRecords = computed(() => {
    const text = this.file.hasValue() ? this.file.value().text : undefined;
    if (text == undefined) return undefined;
    try {
      return parseGedcomRecords(text);
    } catch {
      return undefined;
    }
  });

  // This file's saved copies, newest first. Updates by itself when a save
  // or restore adds one.
  readonly saves = rxResource({
    params: () => this.gedcomFilename(),
    stream: ({ params: gedcomFilename }) =>
      from(
        liveQuery(() =>
          this.ancestryService.dexieDatabase.saves
            .where("gedcomFilename")
            .equals(gedcomFilename)
            .reverse()
            .sortBy("id"),
        ),
      ),
  });

  // The save whose differences from the current file are shown.
  readonly selectedSave = signal<GedcomSave | undefined>(undefined);

  // Undefined when the current file can't be compared.
  readonly differences = computed(() => {
    const save = this.selectedSave();
    const currentGedcomRecords = this.currentGedcomRecords();
    if (save == undefined || currentGedcomRecords == undefined) {
      return undefined;
    }
    return differingGedcomRecords(
      parseGedcomRecords(save.gedcomText),
      currentGedcomRecords,
    );
  });

  toggle(save: GedcomSave) {
    this.selectedSave.update((selected) =>
      selected?.id === save.id ? undefined : save,
    );
  }

  async restore(save: GedcomSave) {
    if (save.id == undefined) return;
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;
    await this.ancestryService.restoreGedcomSave(save.id);
    this.selectedSave.set(undefined);
    this.file.reload();
  }
}
