import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";

@Component({
  selector: "app-sources",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
})
export class SourcesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const sources = Object.values(ancestryDatabase.sources);
    sources.sort((lhs, rhs) => lhs.abbr.localeCompare(rhs.abbr));

    return { sources };
  });
}
