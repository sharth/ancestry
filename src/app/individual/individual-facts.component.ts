import { Component, computed, input } from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { EventsTableComponent } from "../events-table/events-table.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";

@Component({
  selector: "app-individual-facts",
  imports: [EventsTableComponent, IndividualRelativesComponent],
  templateUrl: "./individual-facts.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualFactsComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
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
