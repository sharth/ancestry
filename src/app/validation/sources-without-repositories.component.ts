import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

/** Lists the sources that don't cite any repository (no REPO link), so
 * there's no record of where the original can be found. */
@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly sourcesWithoutRepositories = computed(() =>
    Object.values(this.ancestryDatabase().sources).filter(
      (source) => source.repositoryLinks.length === 0,
    ),
  );
}
