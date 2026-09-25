import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDate } from "../../gedcom/gedcomDate";
import {
  ageAt,
  formatGedcomDateValue,
  formatYear,
  parseGedcomDateValue,
  sortChronologically,
} from "../../gedcom/gedcomDateSort";
import type { GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

export interface TimelineEvent {
  fact: GedcomFact;
  owner: "individual" | "family";
  // For family events shown on an individual's timeline, the family the event
  // belongs to and the individual's spouse in that family. Every family event
  // belongs to exactly one family, so someone with several marriages has
  // events with different familyXrefs rather than events with several.
  familyXref?: string;
  spouseXref?: string;
}

const individualMetadata = {
  ...gedcomIndividualAttributes,
  ...gedcomIndividualEvents,
};
const familyMetadata = { ...gedcomFamilyAttributes, ...gedcomFamilyEvents };

@Component({
  selector: "app-events-timeline",
  imports: [RouterModule, IndividualLinkComponent],
  templateUrl: "./events-timeline.component.html",
  styleUrl: "./events-timeline.component.css",
})
export class EventsTimelineComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly events = input.required<TimelineEvent[]>();
  // When set, each event is labelled with the individual's age at the time.
  readonly birthDate = input<GedcomDate>();

  readonly rows = computed(() => {
    const birthDate = this.birthDate();
    const birth = birthDate ? parseGedcomDateValue(birthDate.value) : undefined;
    const sources = this.ancestryService.ancestryDatabase()?.sources ?? {};

    return sortChronologically(this.events(), (event) => event.fact).map(
      (event) => {
        const fact = event.fact;
        const metadata =
          event.owner === "individual" ?
            individualMetadata[fact.tag]
          : familyMetadata[fact.tag];
        const description = metadata?.humanReadableDescription ?? fact.tag;
        // Generic events and facts are best described by their type.
        const typeIsTitle =
          (fact.tag === "EVEN" || fact.tag === "FACT") && fact.type !== "";

        const date = parseGedcomDateValue(fact.date.value);
        const isBirth = birthDate !== undefined && fact.date === birthDate;

        return {
          event,
          title: typeIsTitle ? fact.type : description,
          year: date ? formatYear(date.year) : "",
          age: birth && date && !isBirth ? ageAt(birth, date) : undefined,
          isBirth,
          date: formatGedcomDateValue(fact.date.value),
          details: [
            fact.value,
            typeIsTitle ? "" : fact.type,
            fact.cause ? `Cause: ${fact.cause}` : "",
          ].filter((detail) => detail !== ""),
          sources: fact.citations.map((citation) => ({
            xref: citation.sourceXref,
            title: sources[citation.sourceXref]?.title || citation.sourceXref,
            page: citation.page,
          })),
        };
      },
    );
  });
}
