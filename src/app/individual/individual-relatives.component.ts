import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { fullname, type GedcomIndividual } from "../../gedcom";
import { AncestryService } from "../../database/ancestry.service";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-individual-relatives",
  standalone: true,
  imports: [CommonModule, IndividualLinkComponent],
  templateUrl: "./individual-relatives.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualRelativesComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return undefined;
    }
    const xref = this.xref();

    const parents: GedcomIndividual[] = ancestry.families
      .values()
      .filter((family) => family.childXrefs.includes(xref))
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((parentXref) => parentXref != null)
      .map((parentXref) => ancestry.individuals.get(parentXref))
      .filter((parent) => parent != null)
      .toArray();
    const siblings: GedcomIndividual[] = ancestry.families
      .values()
      .filter((family) => family.childXrefs.includes(xref))
      .flatMap((family) => family.childXrefs)
      .filter((siblingXref) => siblingXref != xref)
      .map((siblingXref) => ancestry.individuals.get(siblingXref))
      .filter((sibling) => sibling != null)
      .toArray();
    const spouses: GedcomIndividual[] = ancestry.families
      .values()
      .filter((family) => family.husbandXref == xref || family.wifeXref == xref)
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((spouseXref) => spouseXref != null)
      .filter((spouseXref) => spouseXref != xref)
      .map((spouseXref) => ancestry.individuals.get(spouseXref))
      .filter((spouse) => spouse != null)
      .toArray();
    const children: GedcomIndividual[] = ancestry.families
      .values()
      .filter((family) => family.husbandXref == xref || family.wifeXref == xref)
      .flatMap((family) => family.childXrefs)
      .map((childXref) => ancestry.individuals.get(childXref))
      .filter((child) => child != null)
      .toArray();
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
