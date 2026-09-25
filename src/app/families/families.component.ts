import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";

@Component({
  selector: "app-families",
  imports: [RouterLink, IndividualLinkComponent],
  templateUrl: "./families.component.html",
  styleUrl: "./families.component.css",
})
export class FamiliesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const name = (xref: string) => {
      const individual = ancestryDatabase.individuals[xref];
      return individual ? fullname(individual) : xref;
    };
    return {
      families: Object.values(ancestryDatabase.families).sort(
        (lhs, rhs) =>
          name(lhs.husbandXref).localeCompare(name(rhs.husbandXref)) ||
          name(lhs.wifeXref).localeCompare(name(rhs.wifeXref)),
      ),
    };
  });
}
