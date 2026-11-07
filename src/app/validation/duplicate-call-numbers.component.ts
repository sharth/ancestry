import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";

interface SourceUse {
  source: GedcomSource;
  count: number;
}

/**
 * Lists repository call numbers (CALN) used more than once, whichever
 * repository they're under, with the sources that use each.
 */
@Component({
  selector: "app-duplicate-call-numbers",
  imports: [RouterModule, RepositoryCallNumberComponent],
  templateUrl: "./duplicate-call-numbers.component.html",
})
export class DuplicateCallNumbersComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly duplicateCallNumbers = computed(() => {
    const uses = new Map<string, Map<string, SourceUse>>();
    for (const source of Object.values(this.ancestryDatabase().sources)) {
      for (const repositoryLink of source.repositoryLinks) {
        for (const callNumber of repositoryLink.callNumbers) {
          const sources = uses.get(callNumber) ?? new Map<string, SourceUse>();
          uses.set(callNumber, sources);
          const use = sources.get(source.xref) ?? { source, count: 0 };
          sources.set(source.xref, use);
          use.count++;
        }
      }
    }
    return Array.from(uses, ([callNumber, sources]) => ({
      callNumber,
      sources: Array.from(sources.values()),
    })).filter(
      ({ sources }) => sources.reduce((sum, use) => sum + use.count, 0) > 1,
    );
  });
}
