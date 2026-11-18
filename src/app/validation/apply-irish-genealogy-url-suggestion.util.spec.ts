import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  applyIrishGenealogyUrlSuggestion,
  irishGenealogyUrlsToUpdate,
  newIrishGenealogyUrl,
} from "./apply-irish-genealogy-url-suggestion.util";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

describe("newIrishGenealogyUrl", () => {
  it("drops the six character prefix and keeps the record number", () => {
    expect(newIrishGenealogyUrl(oldUrl)).toBe(newUrl);
    expect(newIrishGenealogyUrl(oldUrl.replace("https:", "http:"))).toBe(
      newUrl,
    );
  });

  it("leaves anything else alone", () => {
    expect(newIrishGenealogyUrl(newUrl)).toBeUndefined();
    expect(newIrishGenealogyUrl("MS 123")).toBeUndefined();
    expect(
      newIrishGenealogyUrl(
        "https://civilrecords.irishgenealogy.ie/churchrecords/details/9cbd434898349",
      ),
    ).toBeUndefined();
    expect(newIrishGenealogyUrl(`See ${oldUrl}`)).toBeUndefined();
  });
});

describe("applyIrishGenealogyUrlSuggestion", () => {
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
    expect(irishGenealogyUrlsToUpdate(source)).toEqual([{ oldUrl, newUrl }]);

    const database = applyIrishGenealogyUrlSuggestion(
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
