import { Component, computed, input, signal } from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  fullname,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { EventsTableComponent } from "../events-table/events-table.component";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import { IndividualSunburstComponent } from "./individual-sunburst.component";

export type IndividualTab = "facts" | "sunburst" | "gedcom";

@Component({
  selector: "app-individual",
  imports: [
    IndividualRelativesComponent,
    IndividualAncestorsComponent,
    GedcomEditorDialogComponent,
    IndividualSunburstComponent,
    EventsTableComponent,
    GedcomDisplayComponent,
  ],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly activeTab = signal<IndividualTab>("facts");

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = ancestryDatabase.individuals[this.xref()];
    if (individual === undefined) {
      return undefined;
    }
    return {
      individual,
      name: fullname(individual),
      sex: individual.sex.sex || "Unknown",
      gedcomRecord: serializeGedcomIndividual(individual),
    };
  });
}
