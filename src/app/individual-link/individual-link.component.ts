import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";

@Component({
  selector: "app-individual-link",
  imports: [RouterModule],
  templateUrl: "./individual-link.component.html",
  styleUrl: "./individual-link.component.css",
})
export class IndividualLinkComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const xref = this.xref();
    const individual = this.ancestryDatabase().individuals[xref];

    const name = individual ? fullname(individual) : undefined;

    return {
      xref,
      name,
    };
  });
}
