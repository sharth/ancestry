import { AncestryService } from "../../database/ancestry.service";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-multimedia",
  templateUrl: "./source-multimedia.component.html",
  styleUrl: "./source.component.css",
  imports: [CommonModule, RouterModule],
})
export class SourceMultimediaComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      multimediaLinks: source.multimediaLinks.map((multimediaLink) => ({
        ...ancestry.multimedia.get(multimediaLink.multimediaXref),
        xref: this.xref(),
        title: multimediaLink.title,
      })),
    };
  });
}
