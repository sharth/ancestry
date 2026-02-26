import type { AncestryDatabase } from "../../database/ancestry.service";
import { getFamilyMultimediaCitations } from "../../gedcom/gedcomFamily";
import { getIndividualMultimediaCitations } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia-citations",
  templateUrl: "./multimedia-citations.component.html",
  styleUrl: "./multimedia.component.css",
  imports: [RouterModule, MatTableModule, IndividualLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultimediaCitationsComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
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
              type: "Individual",
              individual,
              event: citation.event,
              citation: citation.citation,
            }),
          ),
        ),
        // Family Citations
        ...Object.values(ancestryDatabase.families).flatMap((family) =>
          getFamilyMultimediaCitations(family, xref).map((citation) => ({
            type: "Family",
            family,
            event: citation.event,
            citation: citation.citation,
          })),
        ),
      ],
    };
  });
}
