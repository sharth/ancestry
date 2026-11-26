import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { gedcomFamilyFacts } from "../../gedcom/gedcomFactMetadata";
import { getFamilySourceCitations } from "../../gedcom/gedcomFamily";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";

@Component({
  selector: "app-family-sources",
  imports: [RouterModule],
  templateUrl: "./family-sources.component.html",
  styleUrl: "./family.component.css",
})
export class FamilySourcesComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const family = ancestryDatabase.families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    const sourceGroups = new Map<
      string,
      {
        event: string;
        eventDescription: string;
        citation: GedcomSourceCitation;
      }[]
    >();
    const citations = getFamilySourceCitations(family).map((citation) => ({
      ...citation,
      eventDescription:
        gedcomFamilyFacts[citation.event]?.humanReadableDescription ??
        citation.event,
    }));
    for (const citation of citations) {
      const rows = sourceGroups.get(citation.citation.sourceXref) ?? [];
      rows.push(citation);
      sourceGroups.set(citation.citation.sourceXref, rows);
    }

    return {
      family,
      sourceGroups: Array.from(sourceGroups.entries())
        .map(([sourceXref, rows]) => ({
          sourceXref,
          source: ancestryDatabase.sources[sourceXref],
          rows,
        }))
        // Sort by the same label the template shows for each source.
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b))),
    };
  });
}

function sourceLabel(group: {
  sourceXref: string;
  source?: GedcomSource;
}): string {
  return group.source?.abbr || group.source?.title || group.sourceXref;
}
