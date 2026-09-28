import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import { computePlaceGroups, placeSlug } from "./places.util";

@Component({
  selector: "app-places",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./places.component.html",
})
export class PlacesComponent {
  readonly ancestryService = inject(AncestryService);
  readonly placeSlug = placeSlug;

  readonly places = computed(() => {
    const database = this.ancestryService.ancestryDatabase();
    if (!database) return [];
    return computePlaceGroups(database);
  });
}
