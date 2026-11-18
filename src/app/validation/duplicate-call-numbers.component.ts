import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { produce } from "immer";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyMergeDuplicateSources,
  mergeConflicts,
  type DuplicateSources,
} from "./apply-merge-duplicate-sources.util";
import { ValidationTableComponent } from "./validation-table.component";

interface SourceUse {
  source: GedcomSource;
  count: number;
}

export interface DuplicateCallNumber {
  callNumber: string;
  sources: SourceUse[];
}

/** The sources sharing `duplicate`'s call number, as a merge: the first in
 * the file is kept, and the rest are merged into it. Undefined when the
 * call number is only repeated within one source. */
export function duplicateCallNumberSources(
  duplicate: DuplicateCallNumber,
): DuplicateSources | undefined {
  const [kept, ...duplicates] = duplicate.sources.map((use) => use.source);
  if (kept === undefined || duplicates.length === 0) return undefined;
  return { kept, duplicates };
}

/** Merges the sources sharing a call number into the first of them (see
 * applyMergeDuplicateSources), then drops every repeat of the call number
 * left on that source, keeping its first use. Pure -- doesn't mutate
 * `database`. */
export function mergeDuplicateCallNumber(
  database: GedcomDatabase,
  duplicate: DuplicateCallNumber,
): GedcomDatabase {
  const group = duplicateCallNumberSources(duplicate);
  const merged = group
    ? applyMergeDuplicateSources(database, [group])
    : database;
  const keptXref = duplicate.sources[0]?.source.xref;
  if (keptXref === undefined) return merged;
  return produce(merged, (draft) => {
    const source = draft.sources[keptXref];
    if (source === undefined) return;
    let seen = false;
    for (const link of source.repositoryLinks) {
      link.callNumbers = link.callNumbers.filter((callNumber) => {
        if (callNumber !== duplicate.callNumber) return true;
        if (seen) return false;
        seen = true;
        return true;
      });
    }
  });
}

/**
 * Lists repository call numbers (CALN) used more than once, whichever
 * repository they're under, with the sources that use each, and suggests
 * merging the sources that share one into a single source.
 */
@Component({
  selector: "app-duplicate-call-numbers",
  imports: [
    RouterModule,
    RepositoryCallNumberComponent,
    ValidationTableComponent,
  ],
  templateUrl: "./duplicate-call-numbers.component.html",
})
export class DuplicateCallNumbersComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(() =>
    findDuplicateCallNumbers(this.ancestryDatabase()).map((duplicate) => {
      const group = duplicateCallNumberSources(duplicate);
      return {
        key: duplicate.callNumber,
        ...duplicate,
        conflicts: group ? mergeConflicts(group) : [],
        fixedDatabase: mergeDuplicateCallNumber(
          this.ancestryDatabase(),
          duplicate,
        ),
        editorTabs: duplicate.sources
          .slice(0, 1)
          .map((use) => ({ type: "SOUR" as const, xref: use.source.xref })),
      };
    }),
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}

export function findDuplicateCallNumbers(
  gedcomDatabase: GedcomDatabase,
): DuplicateCallNumber[] {
  const uses = new Map<string, Map<string, SourceUse>>();
  for (const source of Object.values(gedcomDatabase.sources)) {
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
}
