import { AncestryService } from "../../database/ancestry.service";
import { fullname } from "../../gedcom/gedcomIndividual";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-individual-link",
  imports: [CommonModule, RouterModule],
  templateUrl: "./individual-link.component.html",
  styleUrl: "./individual-link.component.css",
})
export class IndividualLinkComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const xref = this.xref();
    const ancestry = this.ancestryResource.value();
    const individual = ancestry?.individuals.get(xref);

    const name = individual ? fullname(individual) : undefined;

    return {
      xref,
      name,
    };
  });
}
