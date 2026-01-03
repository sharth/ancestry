import type { AncestryDatabase } from "../database/ancestry.service";
import { serializeGedcomRecordToText } from "../gedcom/gedcomRecord";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";

@Component({
  selector: "app-input-unknown-records",
  templateUrl: "./input-unknown-records.component.html",
  styleUrl: "./input.component.css",
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputUnknownRecordsComponent implements FormValueControl<
  GedcomRecord[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomRecord[]>([]);

  removeUnknownRecord(index: number) {
    this.value.update((unknownRecords) => unknownRecords.toSpliced(index, 1));
  }

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;
}
