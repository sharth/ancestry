import { Component, computed, input } from "@angular/core";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { nameToString } from "../../gedcom/gedcomIndividual";
import {
  EventsTimelineComponent,
  type TimelineEvent,
} from "../events-timeline/events-timeline.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";

@Component({
  selector: "app-individual-facts",
  imports: [EventsTimelineComponent, IndividualRelativesComponent],
  templateUrl: "./individual-facts.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualFactsComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly individual = input.required<GedcomIndividual>();

  readonly events = computed((): TimelineEvent[] => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = this.individual();

    // The individual's own events, merged with the events of each family in
    // which they are a spouse. Names have no date, so (like other undated
    // facts) they naturally sort to the end of the timeline - this is also
    // the only place the primary name's citations are shown.
    return [
      ...individual.facts.map((fact): TimelineEvent => ({
        fact,
        owner: "individual",
      })),
      ...individual.names.map((name): TimelineEvent => ({
        fact: newGedcomFact({
          tag: "NAME",
          type: name.nameType,
          value: nameToString(name),
          citations: name.citations,
          notes: name.notes,
        }),
        owner: "individual",
      })),
      ...individual.parentOfFamilyXrefs.flatMap((familyXref) => {
        const family = ancestryDatabase.families[familyXref];
        if (family == undefined) return [];
        const spouseXref =
          family.husbandXref === individual.xref
            ? family.wifeXref
            : family.husbandXref;
        return family.facts.map((fact): TimelineEvent => ({
          fact,
          owner: "family",
          familyXref,
          spouseXref: spouseXref || undefined,
        }));
      }),
    ];
  });

  readonly birthDate = computed(
    () => this.individual().facts.find((fact) => fact.tag === "BIRT")?.date,
  );
}
