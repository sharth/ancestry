import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";
import { fullname } from "../../gedcom/gedcomIndividual";

export interface EventItem {
  eventType: string;
  date: string;
  linkXref?: string;
  linkName?: string;
  isFamily?: boolean;
}

export interface AddressGroup {
  name: string;
  events: EventItem[];
}

export interface PlaceGroup {
  name: string;
  addresses: AddressGroup[];
}

/** Every individual/family event that has a place or address, grouped by
 * place name and then by address, sorted alphabetically at both levels. */
export function computePlaceGroups(database: GedcomDatabase): PlaceGroup[] {
  const placeMap = new Map<string, Map<string, EventItem[]>>();

  const addEvent = (place: string, address: string, event: EventItem) => {
    place ||= "[Unknown Place]";
    address ||= "[Unknown Address]";

    let pMap = placeMap.get(place);
    if (!pMap) {
      pMap = new Map();
      placeMap.set(place, pMap);
    }

    let aMap = pMap.get(address);
    if (!aMap) {
      aMap = [];
      pMap.set(address, aMap);
    }

    aMap.push(event);
  };

  for (const individual of Object.values(database.individuals)) {
    const name = fullname(individual);
    for (const event of individual.facts) {
      if (event.place || event.address) {
        addEvent(event.place, event.address, {
          eventType:
            gedcomIndividualAttributes[event.tag]?.humanReadableDescription ??
            gedcomIndividualEvents[event.tag]?.humanReadableDescription ??
            event.tag,
          date: event.date.value,
          linkXref: individual.xref,
          linkName: name,
          isFamily: false,
        });
      }
    }
  }

  for (const family of Object.values(database.families)) {
    for (const event of family.facts) {
      if (event.place || event.address) {
        addEvent(event.place, event.address, {
          eventType:
            gedcomFamilyAttributes[event.tag]?.humanReadableDescription ??
            gedcomFamilyEvents[event.tag]?.humanReadableDescription ??
            event.tag,
          date: event.date.value,
          linkXref: family.xref,
          linkName: `Family ${family.xref}`,
          isFamily: true,
        });
      }
    }
  }

  return Array.from(placeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([placeName, addressesMap]) => {
      const sortedAddresses: AddressGroup[] = Array.from(addressesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([addressName, events]) => ({
          name: addressName,
          events: events,
        }));
      return { name: placeName, addresses: sortedAddresses };
    });
}

/** URL-safe slug for a single hierarchy segment, e.g. "Cecil County" ->
 * "cecil-county". */
export function placeSlug(segment: string): string {
  return segment
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Splits a raw GEDCOM place string on commas into its region hierarchy,
 * broadest region first: GEDCOM lists places most-specific-first, e.g.
 * "Elkton, Cecil County, Maryland, United States" becomes
 * ["United States", "Maryland", "Cecil County", "Elkton"]. */
export function placeHierarchy(placeName: string): string[] {
  return placeName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .reverse();
}

export interface PlaceTreeNode {
  /** Raw (unslugged) name of this node, e.g. "Maryland". Empty at the root. */
  name: string;
  /** Path from the root to this node, raw names, broadest first. */
  path: string[];
  children: Map<string, PlaceTreeNode>;
  /** Set when this exact path is itself a place referenced by events. */
  place?: PlaceGroup;
}

/** Builds the region hierarchy tree for every place in the database, so a
 * region (e.g. "Maryland, United States") can be browsed down to the
 * specific places (counties, cities) within it. */
export function buildPlaceTree(database: GedcomDatabase): PlaceTreeNode {
  const root: PlaceTreeNode = { name: "", path: [], children: new Map() };

  for (const placeGroup of computePlaceGroups(database)) {
    let node = root;
    const path: string[] = [];
    for (const name of placeHierarchy(placeGroup.name)) {
      path.push(name);
      const slug = placeSlug(name);
      let child = node.children.get(slug);
      if (!child) {
        child = { name, path: [...path], children: new Map() };
        node.children.set(slug, child);
      }
      node = child;
    }
    node.place = placeGroup;
  }

  return root;
}

/** Walks `root` following each already-slugged segment in `slugs`, or
 * returns undefined if no place's hierarchy has a matching prefix. */
export function findPlaceNode(
  root: PlaceTreeNode,
  slugs: readonly string[],
): PlaceTreeNode | undefined {
  let node = root;
  for (const slug of slugs) {
    const child = node.children.get(slug);
    if (!child) return undefined;
    node = child;
  }
  return node;
}

/** The `/place/...` route segments for a node, e.g. ["united-states",
 * "maryland"]. */
export function placeNodeSlugs(node: PlaceTreeNode): string[] {
  return node.path.map(placeSlug);
}
