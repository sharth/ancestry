import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-family-relatives",
  imports: [IndividualLinkComponent],
  templateUrl: "./family-relatives.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyRelativesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly family = input.required<GedcomFamily>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryDatabase();
    const family = this.family();

    return {
      husband:
        family.husbandXref ?
          ancestry.individuals[family.husbandXref]
        : undefined,
      wife: family.wifeXref ? ancestry.individuals[family.wifeXref] : undefined,
      children: family.childXrefs
        .map((childXref) => ancestry.individuals[childXref])
        .filter((child) => child !== undefined),
    };
  });
}
