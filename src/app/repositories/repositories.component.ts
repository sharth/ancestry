import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";

@Component({
  selector: "app-repositories",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./repositories.component.html",
  styleUrl: "./repositories.component.css",
})
export class RepositoriesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      repositories: Object.values(ancestryDatabase.repositories),
    };
  });
}
