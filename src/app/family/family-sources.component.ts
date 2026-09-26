import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { getFamilySourceCitations } from "../../gedcom/gedcomFamily";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";

@Component({
  selector: "app-family-sources",
  imports: [RouterModule],
  templateUrl: "./family-sources.component.html",
  styleUrl: "./family.component.css",
})
export class FamilySourcesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const family = ancestryDatabase.families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    const sourceGroups = new Map<
      string,
      { event: string; citation: GedcomSourceCitation }[]
    >();
    const citations = getFamilySourceCitations(family);
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
        .sort((a, b) => a.sourceXref.localeCompare(b.sourceXref)),
    };
  });
}
