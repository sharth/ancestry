import { AncestryService } from "../../database/ancestry.service";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor-multimedia-links",
  templateUrl: "./source-editor-multimedia-links.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [RouterModule, FormsModule],
})
export class SourceEditorMultimediaLinksComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly multimediaLinks =
    input.required<{ multimediaXref: string; title?: string }[]>();

  readonly addMultimediaLink = output();
  readonly removeMultimediaLink = output<{
    multimediaXref: string;
    title?: string;
  }>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) return undefined;

    return {
      multimediaLinks: this.multimediaLinks(),
      multimedias: ancestry.multimedias,
    };
  });
}
