import { AncestryService } from "../../database/ancestry.service";
import { EventsTableComponent } from "../events-table/events-table.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";

@Component({
  selector: "app-individual-events",
  imports: [EventsTableComponent],
  templateUrl: "./individual-events.component.html",
  styleUrl: "./individual.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualEventsComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }
    const individual = ancestry.individuals[this.xref()];
    if (individual === undefined) {
      return undefined;
    }
    return {
      events: individual.events,
    };
  });
}
