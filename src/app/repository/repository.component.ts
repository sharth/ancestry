import type { AncestryDatabase } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { RepositorySourcesComponent } from "./repository-sources.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-repository",
  imports: [
    RouterModule,
    RepositorySourcesComponent,
    GedcomEditorDialogComponent,
  ],
  templateUrl: "./repository.component.html",
  styleUrl: "./repository.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoryComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const repository = ancestryDatabase.repositories[this.xref()];
    if (repository == undefined) {
      return undefined;
    }

    return {
      name: repository.name,
      gedcom: serializeGedcomRecordToText(
        serializeGedcomRepository(repository),
      ).join("\n"),
    };
  });

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  openRepositoryEditor() {
    this.editDialog().showModal();
  }
}
