import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";

@Component({
  selector: "app-source-unknowns",
  templateUrl: "./source-unknowns.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
})
export class SourceUnknownsComponent {
  readonly xref = input.required<string>();
  readonly gedcom = input.required<GedcomResourceValue>();

  readonly vm = computed(() => {
    const ancestry = this.gedcom().gedcomDatabase;
    const source = ancestry.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      unknownGedcom: source.unknownRecords.map((unknownRecord) =>
        serializeGedcomRecordToText(unknownRecord),
      ),
    };
  });
}
