import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import type { GedcomIndividual } from "../../gedcom";
import { AncestryService } from "../../database/ancestry.service";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";

@Component({
  selector: "app-individuals",
  standalone: true,
  imports: [CommonModule, RouterLink, IndividualEditorComponent],
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
      individualsBySurname: this.individualsBySurname(
        Array.from(ancestry.individuals.values())
      ),
    };
  });

  private individualsBySurname(
    individuals: GedcomIndividual[]
  ): { surname?: string; individuals: GedcomIndividual[] }[] {
    individuals = individuals.toSorted(
      (lhs, rhs) =>
        (lhs.surname ?? "").localeCompare(rhs.surname ?? "") ||
        (lhs.name ?? "").localeCompare(rhs.name ?? "")
    );
    const individualsMap = Map.groupBy(
      individuals,
      (individual) => individual.surname
    );
    return Array.from(individualsMap.entries()).map(
      ([surname, individuals]) => ({ surname, individuals })
    );
  }
}
