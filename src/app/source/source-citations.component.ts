import { AncestryService } from "../../database/ancestry.service";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import { Component, computed, inject, input } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-citations",
  templateUrl: "./source-citations.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule, MatTableModule, IndividualLinkComponent],
})
export class SourceCitationsComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const xref = this.xref();
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      citations: [
        // Individual Event Citations
        ...ancestry.individuals
          .values()
          .flatMap((individual) =>
            individual.events
              .filter((event) => event.citations.length > 0)
              .map((event) => ({ individual, event })),
          )
          .flatMap(({ individual, event }) =>
            event.citations
              .filter((citation) => citation.sourceXref == xref)
              .map((citation) => ({ individual, event, citation })),
          )
          .map(({ individual, event, citation }) => ({
            individual,
            event: event.tag,
            citation,
          })),
        // Individual Sex Citations
        ...ancestry.individuals
          .values()
          .map((individual) => ({
            individual,
            citations: individual.sex?.citations ?? [],
          }))
          .flatMap(({ individual, citations }) =>
            citations.map((citation) => ({
              individual,
              event: "SEX",
              citation,
            })),
          ),
      ],
    };
  });

  //   readonly gridOptions: GridOptions<{
  //     individual: GedcomIndividual;
  //     event: GedcomEvent;
  //     citation: GedcomCitation;
  //   }> = {
  //     columnDefs: [
  //       {
  //         field: "individual",
  //         // cellRenderer: (params) =>
  //         //   `<a routerLink="/individual/${params.value.xref}">${params.value.name}</a>`,
  //       },
  //       { field: "event.type" },
  //       { field: "citation.text" },
  //     ],
  //     autoSizeStrategy: {
  //       type: "fitCellContents",
  //       colIds: ["citation.text"],
  //     },
  //     domLayout: "autoHeight",
  //   };
}
