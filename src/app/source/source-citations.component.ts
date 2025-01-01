import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AncestryService } from "../../database/ancestry.service";
import { MatTableModule } from "@angular/material/table";

@Component({
  selector: "app-source-citations",
  standalone: true,
  templateUrl: "./source-citations.component.html",
  styleUrl: "./source.component.css",
  imports: [CommonModule, RouterModule, MatTableModule],
})
export class SourceCitationsComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const xref = this.xref();
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      citations: Array.from(ancestry.individuals.values())
        .flatMap((individual) =>
          individual.events.map((event) => ({ individual, event }))
        )
        .flatMap(({ individual, event }) =>
          event.citations
            .filter((citation) => citation.sourceXref == xref)
            .map((citation) => ({ individual, event, citation }))
        ),
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
