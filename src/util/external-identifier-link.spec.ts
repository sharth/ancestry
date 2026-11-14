import { describe, expect, it } from "vitest";

import { newGedcomExternalIdentifier } from "../gedcom/gedcomExternalIdentifier";
import {
  ancestryPersonIdType,
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
