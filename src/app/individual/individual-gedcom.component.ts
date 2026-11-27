import { Component, computed, input } from "@angular/core";

import {
  serializeGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";

@Component({
  selector: "app-individual-gedcom",
  imports: [GedcomDisplayComponent],
  templateUrl: "./individual-gedcom.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualGedcomComponent {
  readonly individual = input.required<GedcomIndividual>();
  readonly gedcomRecord = computed<GedcomRecord>(() =>
    serializeGedcomIndividual(this.individual()),
  );
}
