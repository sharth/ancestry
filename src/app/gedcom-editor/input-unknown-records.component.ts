import { Component, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import type { Immutable } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";

@Component({
  selector: "app-input-unknown-records",
  templateUrl: "./input-unknown-records.component.html",
  styleUrl: "./input.component.css",
  imports: [],
})
export class InputUnknownRecordsComponent implements FormValueControl<
  readonly Immutable<GedcomRecord>[]
> {
  readonly workingDatabase = input.required<Immutable<GedcomDatabase>>();
  readonly value = model<readonly Immutable<GedcomRecord>[]>([]);

  removeUnknownRecord(index: number) {
    this.value.update((unknownRecords) => unknownRecords.toSpliced(index, 1));
  }

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;
}
