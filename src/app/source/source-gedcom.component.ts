import { Component, computed, inject, input } from "@angular/core";

import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";

@Component({
  selector: "app-source-gedcom",
  templateUrl: "./source-gedcom.component.html",
  styleUrl: "./source.component.css",
  imports: [GedcomDisplayComponent, SourceUnknownsComponent],
})
export class SourceGedcomComponent {
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

    return {
      gedcomRecord: serializeGedcomSource(source),
    };
  });
}
