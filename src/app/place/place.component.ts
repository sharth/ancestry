import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { PlaceTreeNode } from "../places/places.util";
import {
  buildPlaceTree,
  collectPlaceGroups,
  placeNodeSlugs,
} from "../places/places.util";

@Component({
  selector: "app-place",
  imports: [RouterLink],
  templateUrl: "./place.component.html",
})
export class PlaceComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly path = input.required<string[]>();

  readonly node = computed<PlaceTreeNode | undefined>(() => {
    const tree = buildPlaceTree(this.ancestryDatabase());
    return this.path().reduce<PlaceTreeNode | undefined>(
      (node, slug) => node?.children.get(slug),
      tree,
    );
  });

  readonly breadcrumbs = computed(() => {
    const node = this.node();
    if (!node) return [];
    // node.path, not this.path(): these are the names as originally
    // recorded (casing, punctuation and all), not the lowercased route
    // slugs used to look the node up.
    return node.path.map((name, index) => ({
      name,
      slugs: placeNodeSlugs(node).slice(0, index + 1),
    }));
  });

  readonly children = computed(() => {
    const node = this.node();
    if (!node) return [];
    return Array.from(node.children.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });

  /** Events recorded anywhere under this place, e.g. visiting Maryland also
   * shows events recorded at "Baltimore, Maryland, United States". */
  readonly placeGroups = computed(() => {
    const node = this.node();
    return node ? collectPlaceGroups(node) : [];
  });

  readonly placeNodeSlugs = placeNodeSlugs;
}
