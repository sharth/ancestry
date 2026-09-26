import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { getFamilySourceCitations } from "../../gedcom/gedcomFamily";
import { getIndividualSourceCitations } from "../../gedcom/gedcomIndividual";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

interface SourceCitationRow {
  event: string;
  spouseXref?: string;
  citation: GedcomSourceCitation;
}

@Component({
  selector: "app-individual-sources",
  imports: [RouterModule, IndividualLinkComponent],
  templateUrl: "./individual-sources.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualSourcesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = ancestryDatabase.individuals[this.xref()];
    if (individual == undefined) {
      return undefined;
    }

    const citations: SourceCitationRow[] = [
      ...getIndividualSourceCitations(individual),
      ...individual.parentOfFamilyXrefs.flatMap((familyXref) => {
        const family = ancestryDatabase.families[familyXref];
        if (family == undefined) return [];
        const spouseXref =
          family.husbandXref === individual.xref ?
            family.wifeXref
          : family.husbandXref;
        return getFamilySourceCitations(family).map((citation) => ({
          ...citation,
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

    return {
      individual,
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
