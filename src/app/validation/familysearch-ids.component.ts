import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname, type GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  applyFamilySearchIdSuggestion,
  familySearchIdsToConvert,
} from "./apply-familysearch-id-suggestion.util";

/** The individuals whose FamilySearch person id is in a non-standard
 * `_FSFTID` record, which can move to a standard EXID. */
export function findFamilySearchIdsToConvert(
  database: GedcomDatabase,
): GedcomIndividual[] {
  return Object.values(database.individuals).filter(
    (individual) => familySearchIdsToConvert(individual).length > 0,
  );
}

/** Lists the individuals with a `_FSFTID` and suggests moving it to an
 * EXID with the FamilySearch person type. Reviewing or submitting a
 * suggestion is handed back to the validation page, which owns the editor
 * dialog. */
@Component({
  selector: "app-familysearch-ids",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./familysearch-ids.component.html",
})
export class FamilySearchIdsComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewSuggestion = output<GedcomIndividual>();
  readonly submitSuggestion = output<GedcomIndividual>();
  readonly submitAllSuggestions = output<GedcomIndividual[]>();

  readonly individuals = computed(() =>
    findFamilySearchIdsToConvert(this.ancestryDatabase()),
  );

  readonly rows = computed(() =>
    this.individuals().map((individual) => ({
      individual,
      name: fullname(individual),
      ids: familySearchIdsToConvert(individual),
      // The records that would actually change on disk, built from the
      // same diff the save path uses.
      differences: this.ancestryService.gedcomDatabaseDifferences(
        applyFamilySearchIdSuggestion(this.ancestryDatabase(), [
          individual.xref,
        ]),
      ),
    })),
  );
}
