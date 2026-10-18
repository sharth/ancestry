import { Component, computed, input } from "@angular/core";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";

@Component({
  selector: "app-source-gedcom",
  templateUrl: "./source-gedcom.component.html",
  styleUrl: "./source.component.css",
  imports: [GedcomDisplayComponent, SourceUnknownsComponent],
})
export class SourceGedcomComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const source = this.ancestryDatabase().sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      gedcomRecord: serializeGedcomSource(source),
    };
  });
}
