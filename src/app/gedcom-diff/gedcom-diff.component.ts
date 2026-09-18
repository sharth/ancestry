import { Component, computed, input } from "@angular/core";
import {
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";
import { diff, type Difference } from "./diff";

@Component({
  selector: "app-gedcom-diff",
  templateUrl: "./gedcom-diff.component.html",
  styleUrl: "./gedcom-diff.component.css",
  imports: [],
})
export class GedcomDiffComponent {
  readonly newGedcomRecord = input.required<GedcomRecord | undefined>();
  readonly oldGedcomRecord = input.required<GedcomRecord | undefined>();

  readonly newGedcomText = computed<string[]>(() => {
    const gedcomRecord = this.newGedcomRecord();
    if (gedcomRecord == null) return [];
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly oldGedcomText = computed<string[]>(() => {
    const gedcomRecord = this.oldGedcomRecord();
    if (gedcomRecord == null) return [];
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly differences = computed<Difference[]>(() => {
    const oldGedcomArr = this.oldGedcomText();
    const newGedcomArr = this.newGedcomText();
    return diff(oldGedcomArr, newGedcomArr);
  });
}
