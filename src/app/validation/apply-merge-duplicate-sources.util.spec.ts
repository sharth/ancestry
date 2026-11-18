import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { newGedcomSource, type GedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import {
  applyMergeDuplicateSources,
  mergeConflicts,
} from "./apply-merge-duplicate-sources.util";

function citing(sourceXref: string) {
  return [
    newGedcomSourceCitation({ sourceXref, page: `page of ${sourceXref}` }),
  ];
}

function sourcesOf(...sources: GedcomSource[]) {
  return Object.fromEntries(sources.map((source) => [source.xref, source]));
}

describe("applyMergeDuplicateSources", () => {
  const kept = newGedcomSource({ xref: "@S1@", title: "Census" });
  const duplicate = newGedcomSource({ xref: "@S2@", title: "Census" });

  it("repoints every citation of the duplicate and deletes it", () => {
    const database = newGedcomDatabase({
      sources: sourcesOf(kept, duplicate),
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          sex: newGedcomSex({ citations: citing("@S2@") }),
          names: [newGedcomName({ citations: citing("@S2@") })],
          facts: [newGedcomFact({ tag: "BIRT", citations: citing("@S2@") })],
          unknownRecords: [newGedcomRecord({ tag: "SOUR", value: "@S2@" })],
        }),
        "@I2@": newGedcomIndividual({ xref: "@I2@" }),
      },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          citations: citing("@S2@"),
          facts: [newGedcomFact({ tag: "MARR", citations: citing("@S1@") })],
        }),
      },
    });

    const result = applyMergeDuplicateSources(database, [
      { title: "Census", kept, duplicates: [duplicate] },
    ]);

    expect(Object.keys(result.sources)).toEqual(["@S1@"]);
    const individual = result.individuals["@I1@"];
    // Only the source changes; the rest of each citation is kept.
    expect(individual?.sex.citations).toEqual([
      newGedcomSourceCitation({ sourceXref: "@S1@", page: "page of @S2@" }),
    ]);
    expect(individual?.names[0]?.citations[0]?.sourceXref).toBe("@S1@");
    expect(individual?.facts[0]?.citations[0]?.sourceXref).toBe("@S1@");
    expect(individual?.unknownRecords[0]?.value).toBe("@S1@");
    expect(result.families["@F1@"]?.citations[0]?.sourceXref).toBe("@S1@");
    expect(result.families["@F1@"]?.facts[0]?.citations[0]?.sourceXref).toBe(
      "@S1@",
    );
    // Records that don't cite a duplicate are left as they were.
    expect(result.individuals["@I2@"]).toBe(database.individuals["@I2@"]);
  });

  it("combines repository links, multimedia links and unparsed records without repeats", () => {
    const keptWithLinks = newGedcomSource({
      xref: "@S1@",
      title: "Census",
      repositoryLinks: [
        newGedcomRepositoryLink({ repositoryXref: "@R1@", callNumbers: ["a"] }),
      ],
      multimediaLinks: [newGedcomMultimediaLink({ xref: "@O1@" })],
      unknownRecords: [newGedcomRecord({ tag: "AUTH", value: "Someone" })],
    });
    const duplicateWithLinks = newGedcomSource({
      xref: "@S2@",
      title: "Census",
      text: "Some text",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["a", "b"],
        }),
        newGedcomRepositoryLink({ repositoryXref: "@R2@", callNumbers: ["c"] }),
      ],
      multimediaLinks: [
        newGedcomMultimediaLink({ xref: "@O1@" }),
        newGedcomMultimediaLink({ xref: "@O2@" }),
      ],
      unknownRecords: [
        newGedcomRecord({ tag: "AUTH", value: "Someone" }),
        newGedcomRecord({ tag: "PUBL", value: "Publisher" }),
      ],
    });
    const group = {
      title: "Census",
      kept: keptWithLinks,
      duplicates: [duplicateWithLinks],
    };

    const result = applyMergeDuplicateSources(
      newGedcomDatabase({
        sources: sourcesOf(keptWithLinks, duplicateWithLinks),
      }),
      [group],
    );

    const merged = result.sources["@S1@"];
    expect(merged?.text).toBe("Some text");
    expect(merged?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["a", "b"] },
      { repositoryXref: "@R2@", callNumbers: ["c"] },
    ]);
    expect(merged?.multimediaLinks.map((link) => link.xref)).toEqual([
      "@O1@",
      "@O2@",
    ]);
    expect(merged?.unknownRecords.map((record) => record.tag)).toEqual([
      "AUTH",
      "PUBL",
    ]);
    expect(mergeConflicts(group)).toEqual([]);
  });

  it("keeps the kept source's value where the two differ, and reports it", () => {
    const keptWithText = newGedcomSource({
      xref: "@S1@",
      title: "Census",
      text: "First",
      unknownRecords: [newGedcomRecord({ tag: "AUTH", value: "One" })],
    });
    const duplicateWithText = newGedcomSource({
      xref: "@S2@",
      title: "Census",
      text: "Second",
      unknownRecords: [newGedcomRecord({ tag: "AUTH", value: "Two" })],
    });
    const group = {
      title: "Census",
      kept: keptWithText,
      duplicates: [duplicateWithText],
    };

    const result = applyMergeDuplicateSources(
      newGedcomDatabase({
        sources: sourcesOf(keptWithText, duplicateWithText),
      }),
      [group],
    );

    expect(result.sources["@S1@"]?.text).toBe("First");
    expect(result.sources["@S1@"]?.unknownRecords).toEqual(
      keptWithText.unknownRecords,
    );
    expect(mergeConflicts(group)).toEqual(["TEXT of @S2@", "AUTH of @S2@"]);
  });
});
