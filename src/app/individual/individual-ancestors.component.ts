import { Component, computed, input } from "@angular/core";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import { IndividualSunburstComponent } from "./individual-sunburst.component";

@Component({
  selector: "app-individual-ancestors",
  imports: [
    IndividualLinkComponent,
    IndividualSunburstComponent,
    IndividualRelativesComponent,
  ],
  templateUrl: "./individual-ancestors.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualAncestorsComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly individual = input.required<GedcomIndividual>();

  readonly ancestors = computed(() => {
    const ancestry = this.ancestryDatabase();
    const individual = this.individual();

    const ancestors: (GedcomIndividual | undefined)[] = [];
    ancestors[1] = individual;
    for (let i = 1; i < ancestors.length && i < 16384; i++) {
      const child = ancestors[i];
      if (child == undefined) continue;
      const familyXref = child.childOfFamilyXrefs[0];
      if (familyXref == undefined) continue;
      const family = ancestry.families[familyXref];
      if (family == undefined) continue;
      if (family.husbandXref) {
        ancestors[2 * i + 0] = ancestry.individuals[family.husbandXref];
      }
      if (family.wifeXref) {
        ancestors[2 * i + 1] = ancestry.individuals[family.wifeXref];
      }
    }

    return ancestors;
  });
}
