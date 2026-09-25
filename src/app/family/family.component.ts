import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import { fullname } from "../../gedcom/gedcomIndividual";
import {
  EventsTimelineComponent,
  type TimelineEvent,
} from "../events-timeline/events-timeline.component";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-family",
  imports: [
    RouterModule,
    EventsTimelineComponent,
    GedcomDisplayComponent,
    IndividualLinkComponent,
  ],
  templateUrl: "./family.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const family = ancestryDatabase.families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    const name = (xref: string) => {
      const individual = ancestryDatabase.individuals[xref];
      return individual ? fullname(individual) : xref;
    };
    const title =
      [family.husbandXref, family.wifeXref]
        .filter((xref) => xref !== "")
        .map(name)
        .join(" & ") || family.xref;

    const events: TimelineEvent[] = family.facts.map((fact) => ({
      fact,
      owner: "family",
    }));

    return {
      title,
      family,
      events,
      gedcomRecord: serializeGedcomFamily(family),
    };
  });
}
