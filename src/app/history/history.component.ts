import { DatePipe, DecimalPipe } from "@angular/common";
import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { liveQuery } from "dexie";
import { from } from "rxjs";

import {
  AncestryService,
  type GedcomResourceValue,
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
  imports: [DatePipe, DecimalPipe, GedcomDiffComponent],
  templateUrl: "./history.component.html",
})
export class HistoryComponent {
  private readonly ancestryService = inject(AncestryService);
  readonly gedcom = input.required<GedcomResourceValue>();

  readonly gedcomFilename = computed(
    () => this.gedcom().gedcomFileHandle?.name,
  );

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

  readonly differences = computed(() => {
    const save = this.selectedSave();
    if (save == undefined) return [];
    return differingGedcomRecords(
      parseGedcomRecords(save.gedcomText),
      this.gedcom().gedcomRecords,
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
  }
}
