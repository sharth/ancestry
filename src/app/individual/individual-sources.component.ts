import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
} from "../../gedcom/gedcomFactMetadata";
import { getFamilySourceCitations } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { getIndividualSourceCitations } from "../../gedcom/gedcomIndividual";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

interface SourceCitationRow {
  event: string;
  eventDescription: string;
  spouseXref?: string;
  nameText?: string;
  citation: GedcomSourceCitation;
}

interface SourceGroup {
  sourceXref: string;
  source?: GedcomSource;
  rows: SourceCitationRow[];
}

@Component({
  selector: "app-individual-sources",
  imports: [RouterModule, IndividualLinkComponent],
  templateUrl: "./individual-sources.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualSourcesComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly individual = input.required<GedcomIndividual>();

  readonly sourceGroups = computed<SourceGroup[]>(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = this.individual();

    const citations: SourceCitationRow[] = [
      ...getIndividualSourceCitations(individual).map((citation) => ({
        ...citation,
        eventDescription:
          citation.event === "NAME"
            ? "Name"
            : (gedcomIndividualFacts[citation.event]
                ?.humanReadableDescription ?? citation.event),
      })),
      ...individual.parentOfFamilyXrefs.flatMap((familyXref) => {
        const family = ancestryDatabase.families[familyXref];
        if (family == undefined) return [];
        const spouseXref =
          family.husbandXref === individual.xref
            ? family.wifeXref
            : family.husbandXref;
        return getFamilySourceCitations(family).map((citation) => ({
          ...citation,
          eventDescription:
            gedcomFamilyFacts[citation.event]?.humanReadableDescription ??
            citation.event,
          spouseXref: spouseXref || undefined,
        }));
      }),
    ];

    const sourceGroups = new Map<string, SourceCitationRow[]>();
    for (const citation of citations) {
      const rows = sourceGroups.get(citation.citation.sourceXref) ?? [];
      rows.push(citation);
      sourceGroups.set(citation.citation.sourceXref, rows);
    }

    return (
      Array.from(sourceGroups.entries())
        .map(([sourceXref, rows]) => ({
          sourceXref,
          source: ancestryDatabase.sources[sourceXref],
          rows,
        }))
        // Sort by the same label the template shows for each source.
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b)))
    );
  });
}

function sourceLabel(group: SourceGroup): string {
  return group.source?.abbr || group.source?.title || group.sourceXref;
}
