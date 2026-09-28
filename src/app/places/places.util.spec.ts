import { describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { computePlaceGroups, placeSlug } from "./places.util";

describe("placeSlug", () => {
  it("lowercases and dashes non-alphanumeric characters", () => {
    expect(placeSlug("Boston, MA, USA")).toBe("place-boston-ma-usa");
  });

  it("produces the same slug for the same name", () => {
    expect(placeSlug("Paris, France")).toBe(placeSlug("Paris, France"));
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
