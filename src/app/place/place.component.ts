import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { computePlaceGroups, placeSlug } from "../places/places.util";

@Component({
  selector: "app-place",
  imports: [RouterLink],
  templateUrl: "./place.component.html",
})
export class PlaceComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly slug = input.required<string>();

  readonly place = computed(() => {
    const database = this.ancestryDatabase();
    const slug = this.slug();
    return computePlaceGroups(database).find(
      (place) => placeSlug(place.name) === slug,
    );
  });
}
