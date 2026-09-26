import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { getFamilyMultimediaCitations } from "../../gedcom/gedcomFamily";
import { getIndividualMultimediaCitations } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-multimedia-citations",
  templateUrl: "./multimedia-citations.component.html",
  styleUrl: "./multimedia.component.css",
  imports: [RouterModule, IndividualLinkComponent],
})
export class MultimediaCitationsComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const xref = this.xref();
    const ancestryDatabase = this.ancestryDatabase();

    return {
      citations: [
        // Individual Event Citations
        ...Object.values(ancestryDatabase.individuals).flatMap((individual) =>
          getIndividualMultimediaCitations(individual, xref).map(
            (citation) => ({
              type: "Individual" as const,
              individual,
              event: citation.event,
              citation: citation.citation,
            }),
          ),
        ),
        // Family Citations
        ...Object.values(ancestryDatabase.families).flatMap((family) =>
          getFamilyMultimediaCitations(family, xref).map((citation) => ({
            type: "Family" as const,
            family,
            event: citation.event,
            citation: citation.citation,
          })),
        ),
      ],
    };
  });
}
