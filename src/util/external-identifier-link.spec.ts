import { describe, expect, it } from "vitest";

import { newGedcomExternalIdentifier } from "../gedcom/gedcomExternalIdentifier";
import {
  ancestryPersonIdType,
  externalIdentifierFromUrl,
  externalIdentifierLink,
  familySearchPersonIdType,
} from "./external-identifier-link";

describe("externalIdentifierLink", () => {
  it("links a FamilySearch person id", () => {
    expect(
      externalIdentifierLink(
        newGedcomExternalIdentifier({
          id: "KWCB-QS1",
          type: familySearchPersonIdType,
        }),
      ),
    ).toEqual({
      label: "FamilySearch",
      url: "https://www.familysearch.org/tree/person/details/KWCB-QS1",
    });
  });

  it("links an Ancestry person id in its tree", () => {
    expect(
      externalIdentifierLink(
        newGedcomExternalIdentifier({
          id: "142686057968",
          type: ancestryPersonIdType("187758204"),
        }),
      ),
    ).toEqual({
      label: "Ancestry",
      url: "https://www.ancestry.com/family-tree/person/tree/187758204/person/142686057968/facts",
    });
  });

  it("escapes the id", () => {
    expect(
      externalIdentifierLink(
        newGedcomExternalIdentifier({
          id: "../../evil",
          type: familySearchPersonIdType,
        }),
      )?.url,
    ).toBe("https://www.familysearch.org/tree/person/details/..%2F..%2Fevil");
  });

  it("doesn't link unknown types or empty ids", () => {
    expect(
      externalIdentifierLink(
        newGedcomExternalIdentifier({
          id: "1",
          type: "https://www.findagrave.com/memorial/",
        }),
      ),
    ).toBeUndefined();
    expect(
      externalIdentifierLink(
        newGedcomExternalIdentifier({ type: familySearchPersonIdType }),
      ),
    ).toBeUndefined();
  });
});

describe("externalIdentifierFromUrl", () => {
  const familySearch = { id: "GQ8J-538", type: familySearchPersonIdType };
  const ancestry = {
    id: "132395462563",
    type: ancestryPersonIdType("183714515"),
  };

  it.each([
    "https://www.familysearch.org/tree/person/details/GQ8J-538",
    "https://www.familysearch.org/en/tree/person/details/GQ8J-538",
    "https://www.familysearch.org/tree/person/sources/GQ8J-538",
    "https://familysearch.org/ark:/61903/4:1:GQ8J-538",
    "  https://www.familysearch.org/tree/person/details/GQ8J-538  ",
  ])("reads a FamilySearch person from %s", (url) => {
    expect(externalIdentifierFromUrl(url)).toEqual(familySearch);
  });

  it.each([
    "https://www.ancestry.com/family-tree/person/tree/183714515/person/132395462563/facts",
    "https://www.ancestry.com/family-tree/person/tree/183714515/person/132395462563",
    "https://www.ancestry.co.uk/family-tree/person/tree/183714515/person/132395462563/story",
  ])("reads an Ancestry person from %s", (url) => {
    expect(externalIdentifierFromUrl(url)).toEqual(ancestry);
  });

  it.each([
    "GQ8J-538",
    "https://www.familysearch.org/search/record/results",
    "https://www.familysearch.org.evil.example/tree/person/details/GQ8J-538",
    "https://www.ancestry.com/family-tree/tree/183714515",
    "https://www.ancestry.com.evil.example/family-tree/person/tree/1/person/2",
    "javascript:alert(1)",
  ])("ignores %s", (url) => {
    expect(externalIdentifierFromUrl(url)).toBeUndefined();
  });
});
