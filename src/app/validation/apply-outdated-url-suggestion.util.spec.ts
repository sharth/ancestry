import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  applyOutdatedUrlSuggestion,
  outdatedUrl,
  outdatedUrlsToUpdate,
} from "./apply-outdated-url-suggestion.util";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

const deathSource = newGedcomSource({
  xref: "@S1@",
  title: "Civil Death Record, Patrick Murphy",
});

describe("outdatedUrl", () => {
  it("rewrites an old IrishGenealogy.ie civil record URL by the kind of record its source's title names", () => {
    expect(outdatedUrl(oldUrl, deathSource)?.newUrl).toBe(newUrl);
    expect(
      outdatedUrl(oldUrl.replace("https:", "http:"), deathSource)?.newUrl,
    ).toBe(newUrl);
    expect(
      outdatedUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/f1a46a10358934",
        newGedcomSource({ xref: "@S2@", abbr: "Birth, Dublin 1850" }),
      )?.newUrl,
    ).toBe("https://www.irishgenealogy.ie/view/?record_id=cibi-10358934");
    expect(
      outdatedUrl(
        oldUrl,
        newGedcomSource({ xref: "@S3@", title: "Marriage of John Kelly" }),
      )?.newUrl,
    ).toBe("https://www.irishgenealogy.ie/view/?record_id=cima-4898349");
    expect(
      outdatedUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/fd62df2667367",
        newGedcomSource({ xref: "@S4@", abbr: "Marriage, Kelly-Byrne" }),
      )?.newUrl,
    ).toBe("https://www.irishgenealogy.ie/view/?record_id=cima-2667367");
  });

  it("lists an IrishGenealogy.ie URL with no new URL when the kind of record is unclear", () => {
    for (const title of ["", "Civil record", "Birth and death of John"]) {
      expect(
        outdatedUrl(oldUrl, newGedcomSource({ xref: "@S1@", title })),
      ).toEqual({ site: "IrishGenealogy.ie", oldUrl, newUrl: undefined });
    }
  });

  it("rewrites an old Ancestry record URL", () => {
    expect(
      outdatedUrl(
        "https://www.ancestry.com/discoveryui-content/view/150996143:60525",
        deathSource,
      ),
    ).toEqual({
      site: "Ancestry",
      oldUrl:
        "https://www.ancestry.com/discoveryui-content/view/150996143:60525",
      newUrl:
        "https://www.ancestry.com/search/collections/60525/records/150996143",
    });
  });

  it("drops the query string from an old Ancestry record URL", () => {
    const oldUrl =
      "https://www.ancestry.com/discoveryui-content/view/45942789:60901?indiv=try&viewrecord=1&r=an";
    expect(outdatedUrl(oldUrl, deathSource)).toEqual({
      site: "Ancestry",
      oldUrl,
      newUrl:
        "https://www.ancestry.com/search/collections/60901/records/45942789",
    });
  });

  it("leaves anything else alone", () => {
    expect(outdatedUrl(newUrl, deathSource)).toBeUndefined();
    expect(outdatedUrl("MS 123", deathSource)).toBeUndefined();
    expect(
      outdatedUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details/9cbd434898349",
        deathSource,
      ),
    ).toBeUndefined();
    expect(outdatedUrl(`See ${oldUrl}`, deathSource)).toBeUndefined();
  });
});

describe("applyOutdatedUrlSuggestion", () => {
  it("replaces only the old URLs on the given sources", () => {
    const source = newGedcomSource({
      ...deathSource,
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["MS 123", oldUrl],
        }),
      ],
    });
    const other = newGedcomSource({
      ...deathSource,
      xref: "@S2@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: [oldUrl],
        }),
      ],
    });
    expect(outdatedUrlsToUpdate(source)).toEqual([
      { site: "IrishGenealogy.ie", oldUrl, newUrl },
    ]);

    const database = applyOutdatedUrlSuggestion(
      newGedcomDatabase({ sources: { "@S1@": source, "@S2@": other } }),
      ["@S1@"],
    );
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
