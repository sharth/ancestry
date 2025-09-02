import { AncestryService } from "../../database/ancestry.service";
import { type GedcomIndividual, fullname } from "../../gedcom/gedcomIndividual";
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

    const parents: GedcomIndividual[] = individual.childOfFamilyXrefs
      .map((familyXref) => ancestry.families.get(familyXref))
      .filter((family) => family != null)
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((parentXref) => parentXref != null)
      .map((parentXref) => ancestry.individuals.get(parentXref))
      .filter((parent) => parent != null);
    const siblings: GedcomIndividual[] = individual.childOfFamilyXrefs
      .map((familyXref) => ancestry.families.get(familyXref))
      .filter((family) => family != null)
      .flatMap((family) => family.childXrefs)
      .map((siblingXref) => ancestry.individuals.get(siblingXref))
      .filter((sibling) => sibling != null)
      .filter((sibling) => sibling.xref != xref);
    const spouses: GedcomIndividual[] = individual.parentOfFamilyXrefs
      .map((familyXref) => ancestry.families.get(familyXref))
      .filter((family) => family != null)
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((spouseXref) => spouseXref != null)
      .map((spouseXref) => ancestry.individuals.get(spouseXref))
      .filter((spouse) => spouse != null)
      .filter((spouse) => spouse.xref != xref);
    const children: GedcomIndividual[] = individual.parentOfFamilyXrefs
      .map((familyXref) => ancestry.families.get(familyXref))
      .filter((family) => family != null)
      .flatMap((family) => family.childXrefs)
      .map((childXref) => ancestry.individuals.get(childXref))
      .filter((child) => child != null);

    return {
      relatives: [
        ...parents.map((parent) => ({
          individual: parent,
          relationship: parentDescription(parent),
        })),
        ...siblings.map((sibling) => ({
          individual: sibling,
          relationship: siblingDescription(sibling),
        })),
        ...spouses.map((spouse) => ({
          individual: spouse,
          relationship: spouseDescription(spouse),
        })),
        ...children.map((child) => ({
          individual: child,
          relationship: childDescription(child),
        })),
      ],
    };
  });

  fullname = fullname;
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
