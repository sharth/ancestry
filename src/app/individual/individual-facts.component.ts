import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { parseGedcomDateValue } from "../../gedcom/gedcomDateSort";
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
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = ancestryDatabase.individuals[this.xref()];
    if (individual == undefined) {
      return undefined;
    }

    // The individual's own events, merged with the events of each family in
    // which they are a spouse.
    const events: TimelineEvent[] = [
      ...individual.facts.map((fact) => ({
        fact,
        owner: "individual" as const,
      })),
      ...individual.parentOfFamilyXrefs.flatMap((familyXref) => {
        const family = ancestryDatabase.families[familyXref];
        if (family == undefined) return [];
        const spouseXref =
          family.husbandXref === individual.xref ?
            family.wifeXref
          : family.husbandXref;
        return family.facts.map((fact) => ({
          fact,
          owner: "family" as const,
          familyXref,
          spouseXref: spouseXref || undefined,
        }));
      }),
    ];

    const birthDate = individual.facts.find(
      (fact) =>
        fact.tag === "BIRT" &&
        parseGedcomDateValue(fact.date.value) !== undefined,
    )?.date;

    return {
      individual,
      events,
      birthDate,
    };
  });
}
