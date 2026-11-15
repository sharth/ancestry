import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { buildPlaceTree, placeNodeSlugs } from "./places.util";

@Component({
  selector: "app-places",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./places.component.html",
})
export class PlacesComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly placeNodeSlugs = placeNodeSlugs;

  readonly topLevelPlaces = computed(() => {
    const root = buildPlaceTree(this.ancestryDatabase());
    return Array.from(root.children.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });
}
