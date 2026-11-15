import { Component, computed, input } from "@angular/core";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";

@Component({
  selector: "app-family-gedcom",
  imports: [GedcomDisplayComponent],
  templateUrl: "./family-gedcom.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyGedcomComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const family = this.ancestryDatabase().families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    return {
      family,
      gedcomRecord: serializeGedcomFamily(family),
    };
  });
}
