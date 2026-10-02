import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import { buildPlaceTree, placeNodeSlugs } from "./places.util";

@Component({
  selector: "app-places",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./places.component.html",
})
export class PlacesComponent {
  readonly ancestryService = inject(AncestryService);
  readonly placeNodeSlugs = placeNodeSlugs;

  readonly topLevelPlaces = computed(() => {
    const database = this.ancestryService.ancestryDatabase();
    if (!database) return [];
    const root = buildPlaceTree(database);
    return Array.from(root.children.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });
}
