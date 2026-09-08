import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { RepositorySourcesComponent } from "./repository-sources.component";

@Component({
  selector: "app-repository",
  imports: [
    RouterModule,
    RepositorySourcesComponent,
    GedcomEditorDialogComponent,
    GedcomDisplayComponent,
  ],
  templateUrl: "./repository.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositoryComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const repository = ancestryDatabase.repositories[this.xref()];
    if (repository == undefined) {
      return undefined;
    }

    return {
      name: repository.name,
      gedcomRecord: serializeGedcomRepository(repository),
    };
  });
}
