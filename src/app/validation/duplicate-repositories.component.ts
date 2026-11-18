import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { produce } from "immer";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { ValidationTableComponent } from "./validation-table.component";

/** Repositories that share a name. The first in the file is the one kept;
 * the rest are merged into it. */
export interface DuplicateRepositories {
  kept: GedcomRepository;
  duplicates: GedcomRepository[];
}

/** Every group of two or more repositories with the same name (ignoring
 * leading and trailing whitespace). Unnamed repositories are left out. */
export function findDuplicateRepositories(
  database: GedcomDatabase,
): DuplicateRepositories[] {
  const byName = new Map<string, GedcomRepository[]>();
  for (const repository of Object.values(database.repositories)) {
    const name = repository.name.trim();
    if (name === "") continue;
    byName.getOrInsertComputed(name, () => []).push(repository);
  }
  return [...byName.values()].flatMap(([kept, ...duplicates]) =>
    kept !== undefined && duplicates.length > 0 ? [{ kept, duplicates }] : [],
  );
}

/** Merges the duplicate repositories into the kept one: every source's
 * citation of a duplicate is repointed at the kept repository, a source's
 * citations of the kept repository are combined into one carrying every
 * distinct call number, and the duplicates are deleted. Pure -- doesn't
 * mutate `database`. */
export function mergeDuplicateRepositories(
  database: GedcomDatabase,
  { kept, duplicates }: DuplicateRepositories,
): GedcomDatabase {
  const merging = new Set([
    kept.xref,
    ...duplicates.map((duplicate) => duplicate.xref),
  ]);
  return produce(database, (draft) => {
    for (const duplicate of duplicates) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete draft.repositories[duplicate.xref];
    }
    for (const source of Object.values(draft.sources)) {
      const links = source.repositoryLinks.filter((link) =>
        merging.has(link.repositoryXref),
      );
      const [first] = links;
      if (first === undefined) continue;
      // Leave sources that only cite the kept repository, once, untouched.
      if (links.length === 1 && first.repositoryXref === kept.xref) continue;

      first.repositoryXref = kept.xref;
      first.callNumbers = [
        ...new Set(links.flatMap((link) => link.callNumbers)),
      ];
      source.repositoryLinks = source.repositoryLinks.filter(
        (link) => link === first || !merging.has(link.repositoryXref),
      );
    }
  });
}

/** The sources citing any of the repositories in `group`. */
function citingSourceXrefs(
  database: GedcomDatabase,
  { kept, duplicates }: DuplicateRepositories,
): string[] {
  const merging = new Set([
    kept.xref,
    ...duplicates.map((duplicate) => duplicate.xref),
  ]);
  return Object.values(database.sources)
    .filter((source) =>
      source.repositoryLinks.some((link) => merging.has(link.repositoryXref)),
    )
    .map((source) => source.xref);
}

/** Lists repositories that share a name and suggests merging each group
 * into its first repository. */
@Component({
  selector: "app-duplicate-repositories",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./duplicate-repositories.component.html",
})
export class DuplicateRepositoriesComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(() =>
    findDuplicateRepositories(this.ancestryDatabase()).map((group) => ({
      key: group.kept.xref,
      group,
      fixedDatabase: mergeDuplicateRepositories(this.ancestryDatabase(), group),
      // The kept repository, then every source whose citations move to it.
      editorTabs: [
        { type: "REPO", xref: group.kept.xref },
        ...citingSourceXrefs(this.ancestryDatabase(), group).map(
          (xref): TabInformation => ({ type: "SOUR", xref }),
        ),
      ] satisfies TabInformation[],
    })),
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
