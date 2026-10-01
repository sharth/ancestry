import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { PlaceTreeNode } from "../places/places.util";
import { buildPlaceTree, placeNodeSlugs } from "../places/places.util";

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

  readonly placeNodeSlugs = placeNodeSlugs;
}
