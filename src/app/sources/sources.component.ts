import type { AncestryDatabase } from "../../database/ancestry.service";
import { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-sources",
  imports: [RouterLink, GedcomEditorComponent],
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
