import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";

@Component({
  selector: "app-multimedias",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./multimedias.component.html",
  styleUrl: "./multimedias.component.css",
})
export class MultimediasComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      multimedias: Object.values(ancestryDatabase.multimedias),
    };
  });
}
