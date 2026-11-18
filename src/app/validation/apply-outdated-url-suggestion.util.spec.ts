import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  applyOutdatedUrlSuggestion,
  outdatedUrlsToUpdate,
  outdatedUrl,
} from "./apply-outdated-url-suggestion.util";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

describe("outdatedUrl", () => {
  it("rewrites an old IrishGenealogy.ie civil record URL", () => {
    expect(outdatedUrl(oldUrl)?.newUrl).toBe(newUrl);
    expect(outdatedUrl(oldUrl.replace("https:", "http:"))?.newUrl).toBe(newUrl);
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
});
