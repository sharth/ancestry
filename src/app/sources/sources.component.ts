import { AncestryService } from "../../database/ancestry.service";
import { SourceEditorComponent } from "../source-editor/source-editor.component";
import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-sources",
  imports: [RouterLink, SourceEditorComponent],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
})
export class SourcesComponent {
  private readonly ancestryService = inject(AncestryService);

  vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) return undefined;

    const sources = ancestry.sources.values().toArray();
    sources.sort((lhs, rhs) => (lhs.abbr ?? "").localeCompare(rhs.abbr ?? ""));

    return { sources };
  });
}
