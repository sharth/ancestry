import { AncestryService } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname, surname } from "../../gedcom/gedcomIndividual";
import { Component, computed, inject } from "@angular/core";

@Component({
  selector: "app-individuals",
  imports: [CommonModule, IndividualEditorComponent, IndividualLinkComponent],
  templateUrl: "./individuals.component.html",
  styleUrl: "./individuals.component.css",
})
export class IndividualsComponent {
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return undefined;
    }
    return {
      individuals: ancestry.individuals,
      individualsBySurname: this.individualsBySurname(ancestry.individuals),
    };
  });

  private individualsBySurname(
    individuals: Map<string, GedcomIndividual>,
  ): { surname?: string; individuals: GedcomIndividual[] }[] {
    const individualsList = individuals
      .values()
      .toArray()
      .sort(
        (lhs, rhs) =>
          surname(lhs).localeCompare(surname(rhs)) ||
          fullname(lhs).localeCompare(fullname(rhs)),
      );
    return Map.groupBy(individualsList, (individual) => surname(individual))
      .entries()
      .map(([surname, individuals]) => ({ surname, individuals }))
      .toArray();
  }

  readonly fullname = fullname;
}
