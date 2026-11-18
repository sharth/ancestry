import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import {
  applyOutdatedUrlSuggestion,
  citedFactTags,
  outdatedUrl,
  outdatedUrlsToUpdate,
} from "./apply-outdated-url-suggestion.util";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

function citingFact(tag: string, sourceXref: string) {
  return newGedcomFact({
    tag,
    citations: [newGedcomSourceCitation({ sourceXref })],
  });
}

describe("outdatedUrl", () => {
  it("rewrites an old IrishGenealogy.ie civil record URL by the kind of record its source is cited for", () => {
    expect(outdatedUrl(oldUrl, new Set(["DEAT"]))?.newUrl).toBe(newUrl);
    expect(
      outdatedUrl(oldUrl.replace("https:", "http:"), new Set(["DEAT"]))?.newUrl,
    ).toBe(newUrl);
    expect(
      outdatedUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/f1a46a10358934",
        new Set(["BIRT", "SEX"]),
      )?.newUrl,
    ).toBe("https://www.irishgenealogy.ie/view/?record_id=cibi-10358934");
    expect(outdatedUrl(oldUrl, new Set(["MARR", "OCCU"]))?.newUrl).toBe(
      "https://www.irishgenealogy.ie/view/?record_id=cima-4898349",
    );
  });

  it("lists an IrishGenealogy.ie URL with no new URL when the kind of record is unclear", () => {
    for (const tags of [[], ["OCCU"], ["BIRT", "DEAT"]]) {
      expect(outdatedUrl(oldUrl, new Set(tags))).toEqual({
        site: "IrishGenealogy.ie",
        oldUrl,
        newUrl: undefined,
      });
    }
  });

  it("rewrites an old Ancestry record URL", () => {
    expect(
      outdatedUrl(
        "https://www.ancestry.com/discoveryui-content/view/150996143:60525",
      ),
    ).toEqual({
      site: "Ancestry",
      oldUrl:
        "https://www.ancestry.com/discoveryui-content/view/150996143:60525",
      newUrl:
        "https://www.ancestry.com/search/collections/60525/records/150996143",
    });
  });

  it("leaves anything else alone", () => {
    expect(outdatedUrl(newUrl)).toBeUndefined();
    expect(outdatedUrl("MS 123")).toBeUndefined();
    expect(
      outdatedUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details/9cbd434898349",
      ),
    ).toBeUndefined();
    expect(outdatedUrl(`See ${oldUrl}`)).toBeUndefined();
  });
});

describe("citedFactTags", () => {
  it("collects the tags of individual and family facts citing a source", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          facts: [citingFact("DEAT", "@S1@"), citingFact("BIRT", "@S2@")],
        }),
      },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          facts: [citingFact("MARR", "@S1@")],
        }),
      },
    });
    expect(citedFactTags(database, "@S1@")).toEqual(new Set(["DEAT", "MARR"]));
    expect(citedFactTags(database, "@S3@")).toEqual(new Set());
  });
});

describe("applyOutdatedUrlSuggestion", () => {
  it("replaces only the old URLs on the given sources", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["MS 123", oldUrl],
        }),
      ],
    });
    const other = newGedcomSource({
      xref: "@S2@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: [oldUrl],
        }),
      ],
    });
    const original = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          facts: [citingFact("DEAT", "@S1@"), citingFact("DEAT", "@S2@")],
        }),
      },
      sources: { "@S1@": source, "@S2@": other },
    });
    expect(outdatedUrlsToUpdate(original, source)).toEqual([
      { site: "IrishGenealogy.ie", oldUrl, newUrl },
    ]);

    const database = applyOutdatedUrlSuggestion(original, ["@S1@"]);
    expect(database.sources["@S1@"]?.repositoryLinks[0]?.callNumbers).toEqual([
      "MS 123",
      newUrl,
    ]);
    expect(database.sources["@S2@"]).toBe(other);
  });

  it("leaves a call number alone when it has no new URL", () => {
    const original = newGedcomDatabase({
      sources: {
        "@S1@": newGedcomSource({
          xref: "@S1@",
          repositoryLinks: [
            newGedcomRepositoryLink({
              repositoryXref: "@R1@",
              callNumbers: [oldUrl],
            }),
          ],
        }),
      },
    });
    expect(
      applyOutdatedUrlSuggestion(original, ["@S1@"]).sources["@S1@"]
        ?.repositoryLinks[0]?.callNumbers,
    ).toEqual([oldUrl]);
  });
});
