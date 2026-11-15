import { Component, computed, input } from "@angular/core";

import type { GedcomResourceValue } from "../../database/ancestry.service";

@Component({
  selector: "app-index",
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
})
export class IndexComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

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
