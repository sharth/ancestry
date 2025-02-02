import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  fullname,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { AncestryService } from "../../database/ancestry.service";
import { IndividualEventsComponent } from "./individual-events.component";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";

@Component({
  selector: "app-individual",
  standalone: true,
  imports: [
    CommonModule,
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

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
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
        serializeGedcomIndividual(individual)
      ).join("\n"),
    };
  });
}
