import { Component, computed, inject, input } from "@angular/core";

import { AncestryService } from "../../database/ancestry.service";
import { SourceMultimediaComponent } from "./source-multimedia.component";

@Component({
  selector: "app-source-overview",
  templateUrl: "./source-overview.component.html",
  styleUrl: "./source.component.css",
  imports: [SourceMultimediaComponent],
})
export class SourceOverviewComponent {
  readonly xref = input.required<string>();

  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return { source };
  });
}
