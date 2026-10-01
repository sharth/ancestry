import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import {
  buildPlaceTree,
  computePlaceGroups,
  placeHierarchy,
  placeNodeSlugs,
  placeSlug,
} from "./places.util";

function databaseWithPlaces(...places: string[]) {
  return newGedcomDatabase({
    individuals: Object.fromEntries(
      places.map((place, i) => [
        `I${i}`,
        newGedcomIndividual({
          xref: `I${i}`,
          facts: [newGedcomFact({ tag: "BIRT", place })],
        }),
      ]),
    ),
  });
}

describe("placeSlug", () => {
  it("lowercases and dashes non-alphanumeric characters", () => {
    expect(placeSlug("Cecil County")).toBe("cecil-county");
  });

  it("produces the same slug for the same name", () => {
    expect(placeSlug("Maryland")).toBe(placeSlug("Maryland"));
  });
});

describe("placeHierarchy", () => {
  it("splits on commas, broadest region first", () => {
    expect(
      placeHierarchy("Elkton, Cecil County, Maryland, United States"),
    ).toEqual(["United States", "Maryland", "Cecil County", "Elkton"]);
  });

  it("trims whitespace and drops empty segments", () => {
    expect(placeHierarchy("Boston,  , MA")).toEqual(["MA", "Boston"]);
  });
});

describe("computePlaceGroups", () => {
  it("groups individual and family facts by place, then by address", () => {
    const database = newGedcomDatabase({
      individuals: {
        I1: newGedcomIndividual({
          xref: "I1",
          facts: [
            newGedcomFact({
              tag: "BIRT",
              place: "Boston, MA",
              address: "1 Main St",
            }),
          ],
        }),
      },
      families: {
        F1: newGedcomFamily({
          xref: "F1",
          facts: [newGedcomFact({ tag: "MARR", place: "Boston, MA" })],
        }),
      },
    });

    const places = computePlaceGroups(database);
    expect(places.map((p) => p.name)).toEqual(["Boston, MA"]);
    expect(places[0]?.addresses.map((a) => a.name).sort()).toEqual([
      "1 Main St",
      "[Unknown Address]",
    ]);
  });

  it("ignores facts with no place and no address", () => {
    const database = newGedcomDatabase({
      individuals: {
        I1: newGedcomIndividual({
          xref: "I1",
          facts: [newGedcomFact({ tag: "BIRT", place: "", address: "" })],
        }),
      },
    });

    expect(computePlaceGroups(database)).toEqual([]);
  });
});

describe("buildPlaceTree", () => {
  it("nests places under their region hierarchy", () => {
    const database = databaseWithPlaces(
      "Elkton, Cecil County, Maryland, United States",
      "Cecil County, Maryland, United States",
    );
    const root = buildPlaceTree(database);

    const unitedStates = root.children.get("united-states");
    expect(unitedStates?.name).toBe("United States");
    expect(unitedStates?.place).toBeUndefined();

    const maryland = unitedStates?.children.get("maryland");
    expect(maryland?.name).toBe("Maryland");

    const cecilCounty = maryland?.children.get("cecil-county");
    expect(cecilCounty?.name).toBe("Cecil County");
    // "Cecil County, Maryland, United States" is itself a place with events,
    // and also the parent region of Elkton.
    expect(cecilCounty?.place?.name).toBe(
      "Cecil County, Maryland, United States",
    );
    expect(Array.from(cecilCounty?.children.keys() ?? [])).toEqual(["elkton"]);
  });

  it("has no entry for a place that was never seen", () => {
    const database = databaseWithPlaces("Boston, MA");
    const root = buildPlaceTree(database);

    expect(root.children.get("nowhere")).toBeUndefined();
  });
});

describe("placeNodeSlugs", () => {
  it("slugs every segment of a node's path", () => {
    const database = databaseWithPlaces("Elkton, Maryland");
    const root = buildPlaceTree(database);
    const maryland = root.children.get("maryland");
    expect(maryland && placeNodeSlugs(maryland)).toEqual(["maryland"]);
  });
});
