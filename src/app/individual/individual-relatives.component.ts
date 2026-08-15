import { Component, computed, input } from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-individual-relatives",
  imports: [IndividualLinkComponent],
  templateUrl: "./individual-relatives.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualRelativesComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly individual = input.required<GedcomIndividual>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryDatabase();
    const individual = this.individual();

    return {
      parentGroups: individual.childOfFamilyXrefs
        .map((familyXref) => ancestry.families[familyXref])
        .filter((family) => family !== undefined)
        .map((family) => ({
          family: family,
          parents: [family.husbandXref, family.wifeXref]
            .filter((parentXref) => parentXref !== "")
            .map((parentXref) => ancestry.individuals[parentXref])
            .filter((parent) => parent !== undefined),
          siblings: family.childXrefs
            .map((siblingXref) => ancestry.individuals[siblingXref])
            .filter((sibling) => sibling !== undefined)
            .filter((sibling) => sibling.xref !== individual.xref),
          halfsiblings: [family.husbandXref, family.wifeXref]
            .filter((parentXref) => parentXref !== "")
            .map((parentXref) => ancestry.individuals[parentXref])
            .filter((parent) => parent !== undefined)
            .flatMap((parent) => parent.parentOfFamilyXrefs)
            .map((familyXref) => ancestry.families[familyXref])
            .filter((family) => family !== undefined)
            .flatMap((family) => family.childXrefs)
            .map((siblingXref) => ancestry.individuals[siblingXref])
            .filter((sibling) => sibling !== undefined)
            .filter((sibling) => !family.childXrefs.includes(sibling.xref)),
        })),

      spouseGroups: individual.parentOfFamilyXrefs
        .map((familyXref) => ancestry.families[familyXref])
        .filter((family) => family !== undefined)
        .map((family) => {
          const spouseXref =
            family.husbandXref != individual.xref
              ? family.husbandXref
              : family.wifeXref;
          const spouse = spouseXref
            ? ancestry.individuals[spouseXref]
            : undefined;
          const children = family.childXrefs
            .map((childXref) => ancestry.individuals[childXref])
            .filter((child) => child !== undefined);
          return { family, spouse, children };
        }),
    };
  });
}
