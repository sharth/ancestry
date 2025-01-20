import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";
import { SourceEditorComponent } from "../source-editor/source-editor.component";

@Component({
  selector: "app-sources",
  standalone: true,
  imports: [CommonModule, RouterLink, SourceEditorComponent],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
})
export class SourcesComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == undefined) return undefined;

    const sources = ancestry.sources.values().toArray();
    sources.sort((lhs, rhs) => (lhs.abbr ?? "").localeCompare(rhs.abbr ?? ""));

    return { sources };
  });
}
