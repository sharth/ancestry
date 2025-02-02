import { Component, computed, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "../gedcom/gedcomRecord";

@Component({
  selector: "app-gedcom-diff",
  standalone: true,
  templateUrl: "./gedcom-diff.component.html",
  styleUrl: "./gedcom-diff.component.css",
  imports: [CommonModule],
})
export class GedcomDiffComponent {
  readonly newGedcomRecord = input.required<GedcomRecord | undefined>();
  readonly oldGedcomRecord = input.required<GedcomRecord | undefined>();

  readonly newGedcomText = computed(() => {
    const gedcomRecord = this.newGedcomRecord();
    if (gedcomRecord == null) return "";
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly oldGedcomText = computed(() => {
    const gedcomRecord = this.oldGedcomRecord();
    if (gedcomRecord == null) return "";
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly differences = computed(() => {
    const oldGedcomArr = this.oldGedcomText();
    const newGedcomArr = this.newGedcomText();
    const diffs = [];
    let i = 0;
    let j = 0;
    while (i < oldGedcomArr.length && j < newGedcomArr.length) {
      if (oldGedcomArr[i] == newGedcomArr[j]) {
        diffs.push({
          oldLine: oldGedcomArr[i],
          oldColor: "lightgray",
          newLine: newGedcomArr[j],
          newColor: "lightgray",
        });
        i += 1;
        j += 1;
      } else if (newGedcomArr.includes(oldGedcomArr[i], j)) {
        while (oldGedcomArr[i] != newGedcomArr[j]) {
          diffs.push({
            oldLine: "",
            oldColor: "lightgray",
            newLine: newGedcomArr[j],
            newColor: "lightgreen",
          });
          j += 1;
        }
      } else {
        diffs.push({
          oldLine: oldGedcomArr[i],
          oldColor: "lightcoral",
          newLine: "",
          newColor: "lightgray",
        });
        i += 1;
      }
    }
    while (i < oldGedcomArr.length) {
      diffs.push({
        oldLine: oldGedcomArr[i],
        oldColor: "lightcoral",
        newLine: "",
        newColor: "lightgray",
      });
      i += 1;
    }
    while (j < newGedcomArr.length) {
      diffs.push({
        oldLine: "",
        oldColor: "lightgray",
        newLine: newGedcomArr[j],
        newColor: "lightgreen",
      });
      j += 1;
    }
    return diffs;
  });
}
