import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  serializeGedcomRecordToText,
  serializeGedcomEvent,
} from "../../gedcom";
import type { GedcomEvent } from "../../gedcom";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-individual-events",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./individual-events.component.html",
  styleUrl: "./individual-events.component.css",
})
export class IndividualEventsComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return undefined;
    }
    const individual = ancestry.individuals.get(this.xref());
    if (individual === undefined) {
      return undefined;
    }
    return {
      events: individual.events.map((event) => ({
        ...event,
        gedcom: serializeGedcomRecordToText(serializeGedcomEvent(event)).join(
          "\n"
        ),
      })),
    };
  });

  private readonly showEventGedcomMap = new Map<GedcomEvent, boolean>();
  toggleGedcom(event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false;
    this.showEventGedcomMap.set(event, !status);
  }

  showGedcom(event: GedcomEvent): boolean {
    return this.showEventGedcomMap.get(event) ?? false;
  }
}
