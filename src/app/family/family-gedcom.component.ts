import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";

@Component({
  selector: "app-family-gedcom",
  imports: [GedcomDisplayComponent],
  templateUrl: "./family-gedcom.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyGedcomComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
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
