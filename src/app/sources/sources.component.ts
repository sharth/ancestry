import type { AncestryDatabase } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-sources",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcesComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const sources = Object.values(ancestryDatabase.sources);
    sources.sort((lhs, rhs) => lhs.abbr.localeCompare(rhs.abbr));

    return { sources };
  });
}
