import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";

import {
  AncestryService,
  type GedcomResourceValue,
} from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname, type GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { externalIdentifierLink } from "../../util/external-identifier-link";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
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
 * them to EXIDs with the FamilySearch person or Ancestry tree type. */
@Component({
  selector: "app-tree-ids",
  imports: [RouterModule, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./tree-ids.component.html",
})
export class TreeIdsComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  // The individual whose suggestion is open in the editor dialog, if any.
  readonly reviewing = signal<GedcomIndividual | undefined>(undefined);

  // The editor dialog opens with the suggested fix already applied, so it
  // can be reviewed and edited further before saving.
  readonly reviewDatabase = computed(() => {
    const individual = this.reviewing();
    if (individual === undefined) return this.ancestryDatabase();
    return applyTreeIdSuggestion(this.ancestryDatabase(), [individual.xref]);
  });

  readonly reviewTabs = computed<TabInformation[]>(() => {
    const individual = this.reviewing();
    return individual === undefined
      ? []
      : [{ type: "INDI", xref: individual.xref }];
  });

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

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  async review(individual: GedcomIndividual) {
    this.reviewing.set(individual);
    await this.editDialog().showModal();
  }

  // Applies the suggested fix directly and saves it, without opening the
  // editor dialog.
  async submit(individuals: GedcomIndividual[]) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    await this.ancestryService.updateGedcomDatabase(
      applyTreeIdSuggestion(
        this.ancestryDatabase(),
        individuals.map((individual) => individual.xref),
      ),
    );
  }
}
