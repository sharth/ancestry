import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  EventsTimelineComponent,
  type TimelineEvent,
} from "../events-timeline/events-timeline.component";
import { FamilyRelativesComponent } from "./family-relatives.component";

@Component({
  selector: "app-family-facts",
  imports: [EventsTimelineComponent, FamilyRelativesComponent],
  templateUrl: "./family-facts.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyFactsComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const family = this.ancestryDatabase().families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    const events: TimelineEvent[] = family.facts.map((fact) => ({
      fact,
      owner: "family",
    }));

    return { family, events };
  });
}
