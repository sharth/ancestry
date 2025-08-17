import { AncestryService } from "../../database/ancestry.service";
import {
  fullname,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualEventsComponent } from "./individual-events.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import type { ElementRef } from "@angular/core";
import { Component, computed, inject, input, viewChild } from "@angular/core";

@Component({
  selector: "app-individual",
  imports: [
    IndividualRelativesComponent,
    IndividualAncestorsComponent,
    IndividualEventsComponent,
    IndividualEditorComponent,
  ],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);
  private dialog = viewChild<ElementRef<HTMLDialogElement>>("editDialog");

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry === undefined) {
      return undefined;
    }
    const individual = ancestry.individuals.get(this.xref());
    if (individual === undefined) {
      return undefined;
    }
    return {
      name: fullname(individual),
      sex: individual.sex?.sex ?? "Unknown",
      gedcom: serializeGedcomRecordToText(
        serializeGedcomIndividual(individual),
      ).join("\n"),
    };
  });
}
