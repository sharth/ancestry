import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname, surname } from "../../gedcom/gedcomIndividual";
import { AncestryService } from "../../database/ancestry.service";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-individuals",
  standalone: true,
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
    individuals: Map<string, GedcomIndividual>
  ): { surname?: string; individuals: GedcomIndividual[] }[] {
    const individualsList = individuals
      .values()
      .toArray()
      .sort(
        (lhs, rhs) =>
          surname(lhs).localeCompare(surname(rhs)) ||
          fullname(lhs).localeCompare(fullname(rhs))
      );
    return Map.groupBy(individualsList, (individual) => surname(individual))
      .entries()
      .map(([surname, individuals]) => ({ surname, individuals }))
      .toArray();
  }

  readonly fullname = fullname;
}
