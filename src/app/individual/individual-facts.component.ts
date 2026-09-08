import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { EventsTableComponent } from "../events-table/events-table.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";

@Component({
  selector: "app-individual-facts",
  imports: [EventsTableComponent, IndividualRelativesComponent],
  templateUrl: "./individual-facts.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualFactsComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const individual = this.ancestryDatabase().individuals[this.xref()];
    if (individual == undefined) {
      return undefined;
    }

    return {
      individual,
    };
  });
}
