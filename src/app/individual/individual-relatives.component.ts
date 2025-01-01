import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import type { GedcomIndividual } from "../../gedcom";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-individual-relatives",
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          relationship: parentDescription[parent.sex ?? "Unknown"],
        })),
        ...siblings.map((sibling) => ({
          individual: sibling,
          relationship: siblingDescription[sibling.sex ?? "Unknown"],
        })),
        ...spouses.map((spouse) => ({
          individual: spouse,
          relationship: spouseDescription[spouse.sex ?? "Unknown"],
        })),
        ...children.map((child) => ({
          individual: child,
          relationship: childDescription[child.sex ?? "Unknown"],
        })),
      ],
    };
  });
}

const parentDescription = {
  Male: "Father",
  Female: "Mother",
  Unknown: "Parent",
};

const siblingDescription = {
  Male: "Brother",
  Female: "Sister",
  Unknown: "Sibling",
};

const spouseDescription = {
  Male: "Husband",
  Female: "Wife",
  Unknown: "Spouse",
};

const childDescription = {
  Male: "Son",
  Female: "Daughter",
  Unknown: "Child",
};
