import { AncestryService } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import { Component, computed, inject, input } from "@angular/core";

@Component({
  selector: "app-individual-families",
  imports: [IndividualLinkComponent],
  templateUrl: "./individual-families.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualFamiliesComponent {
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

    const families = [];
    for (const familyXref of individual.childOfFamilyXrefs) {
      const family = ancestry.families.get(familyXref);
      if (family == null) continue;
      const parents = [family.husbandXref, family.wifeXref]
        .filter((parentXref) => parentXref != null)
        .map((parentXref) => ancestry.individuals.get(parentXref))
        .filter((parent) => parent != null);
      const siblings = family.childXrefs
        .map((siblingXref) => ancestry.individuals.get(siblingXref))
        .filter((sibling) => sibling != null)
        .filter((sibling) => sibling.xref != xref);
      families.push({
        family,
        familyMembers: [
          ...parents.map((parent) => ({
            individual: parent,
            relationship: parentDescription(parent),
          })),
          ...siblings.map((sibling) => ({
            individual: sibling,
            relationship: siblingDescription(sibling),
          })),
        ],
      });
    }

    for (const familyXref of individual.parentOfFamilyXrefs) {
      const family = ancestry.families.get(familyXref);
      if (family == null) continue;
      const spouses = [family.husbandXref, family.wifeXref]
        .filter((spouseXref) => spouseXref != null)
        .map((spouseXref) => ancestry.individuals.get(spouseXref))
        .filter((spouse) => spouse != null)
        .filter((spouse) => spouse.xref != xref);
      const children = family.childXrefs
        .map((childXref) => ancestry.individuals.get(childXref))
        .filter((child) => child != null);
      families.push({
        family,
        familyMembers: [
          ...spouses.map((spouse) => ({
            individual: spouse,
            relationship: spouseDescription(spouse),
          })),
          ...children.map((child) => ({
            individual: child,
            relationship: childDescription(child),
          })),
        ],
      });
    }

    return {
      families,
    };
  });
}

function parentDescription(gedcomIndividual: GedcomIndividual): string {
  switch (gedcomIndividual.sex?.sex) {
    case "M":
      return "Father";
    case "F":
      return "Mother";
    default:
      return "Parent";
  }
}
function siblingDescription(gedcomIndividual: GedcomIndividual): string {
  switch (gedcomIndividual.sex?.sex) {
    case "M":
      return "Brother";
    case "F":
      return "Sister";
    default:
      return "Sibling";
  }
}

function spouseDescription(gedcomIndividual: GedcomIndividual): string {
  switch (gedcomIndividual.sex?.sex) {
    case "M":
      return "Husband";
    case "F":
      return "Wife";
    default:
      return "Spouse";
  }
}

function childDescription(gedcomIndividual: GedcomIndividual): string {
  switch (gedcomIndividual.sex?.sex) {
    case "M":
      return "Son";
    case "F":
      return "Daughter";
    default:
      return "Child";
  }
}
