import { AncestryService } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";

@Component({
  selector: "app-individual-ancestors",
  imports: [IndividualLinkComponent],
  templateUrl: "./individual-ancestors.component.html",
  styleUrl: "./individual.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualAncestorsComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }
    const families = Object.values(ancestry.families);

    const ancestors: (GedcomIndividual | undefined)[] = [];
    ancestors[1] = ancestry.individuals[this.xref()];
    for (let i = 1; i < ancestors.length && i < 16384; i++) {
      const child = ancestors[i];
      if (child != null) {
        const family = families.find((family) =>
          family.childXrefs.includes(child.xref),
        );
        if (family?.husbandXref) {
          ancestors[2 * i + 0] = ancestry.individuals[family.husbandXref];
        }
        if (family?.wifeXref) {
          ancestors[2 * i + 1] = ancestry.individuals[family.wifeXref];
        }
      }
    }
    return { ancestors };
  });

  readonly fullname = fullname;
}
