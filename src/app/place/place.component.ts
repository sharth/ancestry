import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  buildPlaceTree,
  findPlaceNode,
  placeNodeSlugs,
} from "../places/places.util";

@Component({
  selector: "app-place",
  imports: [RouterLink],
  templateUrl: "./place.component.html",
})
export class PlaceComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly path = input.required<string>();

  readonly node = computed(() => {
    const database = this.ancestryDatabase();
    const slugs = this.path()
      .toLowerCase()
      .split("/")
      .filter((segment) => segment !== "");
    return findPlaceNode(buildPlaceTree(database), slugs);
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
