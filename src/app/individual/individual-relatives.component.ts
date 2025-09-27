import { AncestryService } from "../../database/ancestry.service";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import { Component, computed, inject, input } from "@angular/core";

@Component({
  selector: "app-individual-relatives",
  imports: [IndividualLinkComponent],
  templateUrl: "./individual-relatives.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualRelativesComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }

    const xref = this.xref();
    const individual = ancestry.individuals.get(xref);
    if (individual === undefined) {
      return undefined;
    }

    return {
      parentGroups: individual.childOfFamilyXrefs
        .map((familyXref) => ancestry.families.get(familyXref))
        .filter((family) => family !== undefined)
        .map((family) => ({
          family: family,
          parents: [family.husbandXref, family.wifeXref]
            .filter((parentXref) => parentXref !== undefined)
            .map((parentXref) => ancestry.individuals.get(parentXref))
            .filter((parent) => parent !== undefined),
          siblings: family.childXrefs
            .map((siblingXref) => ancestry.individuals.get(siblingXref))
            .filter((sibling) => sibling !== undefined)
            .filter((sibling) => sibling.xref !== individual.xref),
          halfsiblings: [family.husbandXref, family.wifeXref]
            .filter((parentXref) => parentXref !== undefined)
            .map((parentXref) => ancestry.individuals.get(parentXref))
            .filter((parent) => parent !== undefined)
            .flatMap((parent) => parent.parentOfFamilyXrefs)
            .map((familyXref) => ancestry.families.get(familyXref))
            .filter((family) => family !== undefined)
            .flatMap((family) => family.childXrefs)
            .map((siblingXref) => ancestry.individuals.get(siblingXref))
            .filter((sibling) => sibling !== undefined)
            .filter((sibling) => !family.childXrefs.includes(sibling.xref)),
        })),

      spouseGroups: individual.parentOfFamilyXrefs
        .map((familyXref) => ancestry.families.get(familyXref))
        .filter((family) => family !== undefined)
        .map((family) => {
          const spouseXref =
            family.husbandXref != individual.xref
              ? family.husbandXref
              : family.wifeXref;
          const spouse = spouseXref
            ? ancestry.individuals.get(spouseXref)
            : undefined;
          const children = family.childXrefs
            .map((childXref) => ancestry.individuals.get(childXref))
            .filter((child) => child !== undefined);
          return { family, spouse, children };
        }),
    };
  });
}
