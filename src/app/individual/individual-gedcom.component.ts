import { Component, computed, input } from "@angular/core";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { serializeGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";

@Component({
  selector: "app-individual-gedcom",
  imports: [GedcomDisplayComponent],
  templateUrl: "./individual-gedcom.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualGedcomComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const individual = this.ancestryDatabase().individuals[this.xref()];
    if (individual == undefined) {
      return undefined;
    }

    return {
      individual,
      gedcomRecord: serializeGedcomIndividual(individual),
    };
  });
}
