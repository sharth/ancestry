import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname, surname } from "../../gedcom/gedcomIndividual";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

@Component({
  selector: "app-individuals",
  imports: [IndividualLinkComponent, IndividualEditorComponent],
  templateUrl: "./individuals.component.html",
  styleUrl: "./individuals.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualsComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      individuals: Object.values(ancestryDatabase.individuals),
      individualsBySurname: this.individualsBySurname(
        ancestryDatabase.individuals,
      ),
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
