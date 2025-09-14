import { AncestryService } from "../../database/ancestry.service";
import {
  fullname,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualEventsComponent } from "./individual-events.component";
import { IndividualFamiliesComponent } from "./individual-families.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import { Component, computed, inject, input } from "@angular/core";

@Component({
  selector: "app-individual",
  imports: [
    IndividualRelativesComponent,
    IndividualAncestorsComponent,
    IndividualEventsComponent,
    IndividualEditorComponent,
    IndividualFamiliesComponent,
  ],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
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
