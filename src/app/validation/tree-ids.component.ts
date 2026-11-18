import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname, type GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { externalIdentifierLink } from "../../util/external-identifier-link";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyTreeIdSuggestion,
  treeIdsToConvert,
} from "./apply-tree-id-suggestion.util";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

/** The individuals whose FamilySearch or Ancestry ids are in non-standard
 * `_FSFTID` or `_AMTID` records, which can move to standard EXIDs. */
export function findTreeIdsToConvert(
  database: GedcomDatabase,
): GedcomIndividual[] {
  return Object.values(database.individuals).filter(
    (individual) => treeIdsToConvert(individual).length > 0,
  );
}

/** Lists the individuals with a `_FSFTID` or `_AMTID` and suggests moving
 * them to EXIDs with the FamilySearch person or Ancestry tree type. */
@Component({
  selector: "app-tree-ids",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./tree-ids.component.html",
})
export class TreeIdsComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly individuals = computed(() =>
    findTreeIdsToConvert(this.ancestryDatabase()),
  );

  readonly rows = computed(
    () =>
      this.individuals().map((individual) => ({
        key: individual.xref,
        individual,
        name: fullname(individual),
        ids: treeIdsToConvert(individual).map(
          (externalIdentifier) =>
            `${externalIdentifierLink(externalIdentifier)?.label ?? ""} ${externalIdentifier.id}`,
        ),
        fixedDatabase: applyTreeIdSuggestion(this.ancestryDatabase(), [
          individual.xref,
        ]),
        editorTabs: [{ type: "INDI" as const, xref: individual.xref }],
      })) satisfies ValidationRow[],
  );

  readonly fixAll = () =>
    applyTreeIdSuggestion(
      this.ancestryDatabase(),
      this.individuals().map((individual) => individual.xref),
    );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
