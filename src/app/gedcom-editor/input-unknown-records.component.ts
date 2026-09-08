import { Component, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
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
  GedcomRecord[]
> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomRecord[]>([]);

  removeUnknownRecord(index: number) {
    this.value.update((unknownRecords) => unknownRecords.toSpliced(index, 1));
  }

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;
}
