import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";

@Component({
  selector: "app-events-table",
  imports: [RouterModule],
  templateUrl: "./events-table.component.html",
  styleUrl: "./events-table.component.css",
})
export class EventsTableComponent {
  readonly events = input.required<GedcomFact[]>();
  readonly owner = input.required<"individual" | "family">();

  readonly eventMetadataMap = computed(() => {
    switch (this.owner()) {
      case "individual":
        return { ...gedcomIndividualAttributes, ...gedcomIndividualEvents };
      case "family":
        return { ...gedcomFamilyAttributes, ...gedcomFamilyEvents };
    }
  });
}
