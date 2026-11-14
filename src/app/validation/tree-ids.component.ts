import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname, type GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { externalIdentifierLink } from "../../util/external-identifier-link";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  applyTreeIdSuggestion,
  treeIdsToConvert,
} from "./apply-tree-id-suggestion.util";

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
 * them to EXIDs with the FamilySearch person or Ancestry tree type. Reviewing or submitting a
 * suggestion is handed back to the validation page, which owns the editor
 * dialog. */
@Component({
  selector: "app-tree-ids",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./tree-ids.component.html",
})
export class TreeIdsComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewSuggestion = output<GedcomIndividual>();
  readonly submitSuggestion = output<GedcomIndividual>();
  readonly submitAllSuggestions = output<GedcomIndividual[]>();

  readonly individuals = computed(() =>
    findTreeIdsToConvert(this.ancestryDatabase()),
  );

  readonly rows = computed(() =>
    this.individuals().map((individual) => ({
      individual,
      name: fullname(individual),
      ids: treeIdsToConvert(individual).map(
        (externalIdentifier) =>
          `${externalIdentifierLink(externalIdentifier)?.label ?? ""} ${externalIdentifier.id}`,
      ),
      // The records that would actually change on disk, built from the
      // same diff the save path uses.
      differences: this.ancestryService.gedcomDatabaseDifferences(
        applyTreeIdSuggestion(this.ancestryDatabase(), [individual.xref]),
      ),
    })),
  );
}
