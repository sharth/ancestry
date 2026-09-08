import { Component, computed, input } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

@Component({
  selector: "app-index",
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
})
export class IndexComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();

    return {
      individuals: Object.values(ancestryDatabase.individuals),
      families: Object.values(ancestryDatabase.families),
      sources: Object.values(ancestryDatabase.sources),
      repositories: Object.values(ancestryDatabase.repositories),
      submitters: Object.values(ancestryDatabase.submitters),
    };
  });
}
