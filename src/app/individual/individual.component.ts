import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  serializeGedcomIndividual,
  serializeGedcomRecordToText,
} from "../../gedcom";
import { IndividualRelativesComponent } from "../individual-relatives/individual-relatives.component";
import { IndividualAncestorsComponent } from "../individual-ancestors/individual-ancestors.component";
import { AncestryService } from "../../database/ancestry.service";
import { IndividualEventsComponent } from "../individual-events/individual-events.component";

@Component({
  selector: "app-individual",
  standalone: true,
  imports: [
    CommonModule,
    IndividualRelativesComponent,
    IndividualAncestorsComponent,
    IndividualEventsComponent,
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
      name: individual.name,
      gedcom: serializeGedcomRecordToText(
        serializeGedcomIndividual(individual)
      ).join("\n"),
    };
  });
}
