import { Component, computed, input } from "@angular/core";
import {
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";

@Component({
  selector: "app-gedcom-display",
  templateUrl: "./gedcom-display.component.html",
  styleUrl: "./gedcom-display.component.css",
  imports: [],
})
export class GedcomDisplayComponent {
  readonly gedcomRecord = input.required<GedcomRecord>();
  readonly serializedGedcom = computed(() =>
    serializeGedcomRecordToText(this.gedcomRecord()).map((line) => ({
      text: line,
      level: /^\d+/.exec(line)?.[0],
    })),
  );
}
