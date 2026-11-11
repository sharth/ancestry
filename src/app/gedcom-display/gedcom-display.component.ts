import { Component, computed, input } from "@angular/core";
import type { Immutable } from "immer";

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
  readonly gedcomRecord = input.required<Immutable<GedcomRecord>>();
  readonly serializedGedcom = computed(() =>
    serializeGedcomRecordToText(this.gedcomRecord()),
  );
}
