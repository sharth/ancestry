import { Component, computed, input, signal } from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { fullname } from "../../gedcom/gedcomIndividual";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualFactsComponent } from "./individual-facts.component";
import { IndividualGedcomComponent } from "./individual-gedcom.component";

export type IndividualTab = "facts" | "ancestors" | "gedcom";

@Component({
  selector: "app-individual",
  imports: [
    IndividualFactsComponent,
    IndividualAncestorsComponent,
    IndividualGedcomComponent,
    GedcomEditorDialogComponent,
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
    };
  });
}
