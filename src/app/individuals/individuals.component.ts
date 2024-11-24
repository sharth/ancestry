import type { ResourceRef } from "@angular/core";
import { resource, Component, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ancestryDatabase } from "../../database/ancestry.database";
import type { GedcomIndividual } from "../../gedcom";

@Component({
  selector: "app-individuals",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./individuals.component.html",
  styleUrl: "./individuals.component.css",
})
export class IndividualsComponent {
  readonly resource: ResourceRef<{ individuals: GedcomIndividual[] }> =
    resource({
      request: () => ({
        ancestryDatabaseIteration: ancestryDatabase.iteration(),
      }),
      loader: async () => ({
        individuals: await ancestryDatabase.individuals.toArray(),
      }),
    });

  readonly individuals = computed<GedcomIndividual[]>(
    () => this.resource.value()?.individuals ?? []
  );

  readonly individualsBySurname = computed<
    { surname?: string; individuals: GedcomIndividual[] }[]
  >(() => {
    const individuals = this.individuals().toSorted(
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
  });
}
