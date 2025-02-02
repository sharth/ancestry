import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";

@Component({
  selector: "app-source-unknowns",
  standalone: true,
  templateUrl: "./source-unknowns.component.html",
  styleUrl: "./source.component.css",
  imports: [CommonModule, RouterModule],
})
export class SourceUnknownsComponent {
  readonly xref = input.required<string>();

  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      unknownGedcom: source.unknownRecords.map((unknownRecord) =>
        serializeGedcomRecordToText(unknownRecord)
      ),
    };
  });
}
