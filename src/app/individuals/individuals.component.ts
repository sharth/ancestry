import { AncestryService } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname, surname } from "../../gedcom/gedcomIndividual";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import { Component, computed, inject } from "@angular/core";

@Component({
  selector: "app-individuals",
  imports: [IndividualLinkComponent, IndividualEditorComponent],
  templateUrl: "./individuals.component.html",
  styleUrl: "./individuals.component.css",
})
export class IndividualsComponent {
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }

    return {
      individuals: Object.values(ancestry.individuals),
      individualsBySurname: this.individualsBySurname(ancestry.individuals),
    };
  });

  private individualsBySurname(
    individuals: Record<string, GedcomIndividual>,
  ): { surname?: string; individuals: GedcomIndividual[] }[] {
    const individualsList = Object.values(individuals).sort(
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
