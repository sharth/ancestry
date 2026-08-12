import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { EventsTableComponent } from "../events-table/events-table.component";

@Component({
  selector: "app-individual-events",
  imports: [EventsTableComponent],
  templateUrl: "./individual-events.component.html",
  styleUrl: "./individual.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualEventsComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly individual = input.required<GedcomIndividual>();

  readonly vm = computed(() => {
    const individual = this.individual();
    return {
      events: individual.events,
    };
  });
}
