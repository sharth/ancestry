import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  fullname,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { IndividualEditorComponent } from "../individual-editor/individual-editor.component";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualEventsComponent } from "./individual-events.component";
import { IndividualRelativesComponent } from "./individual-relatives.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = ancestryDatabase.individuals[this.xref()];
    if (individual === undefined) {
      return undefined;
    }
    return {
      name: fullname(individual),
      sex: individual.sex.sex || "Unknown",
      gedcom: serializeGedcomRecordToText(
        serializeGedcomIndividual(individual),
      ).join("\n"),
    };
  });
}
