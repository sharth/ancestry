import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-source-multimedia",
  standalone: true,
  templateUrl: "./source-multimedia.component.html",
  styleUrl: "./source-multimedia.component.css",
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
      multimedia: source.multimediaXrefs.map((multimediaXref) => ({
        ...ancestry.multimedia.get(multimediaXref),
        xref: multimediaXref,
      })),
    };
  });
}
