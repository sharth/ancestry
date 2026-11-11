import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { deleteGedcomRecord } from "./delete-gedcom-record.util";

describe("deleteGedcomRecord", () => {
  it("deletes an individual and clears every family reference to it", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I0@": newGedcomIndividual({
          xref: "@I0@",
          parentOfFamilyXrefs: ["@F0@"],
        }),
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          parentOfFamilyXrefs: ["@F0@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          childOfFamilyXrefs: ["@F0@"],
        }),
      },
      families: {
        "@F0@": newGedcomFamily({
          xref: "@F0@",
          husbandXref: "@I0@",
          wifeXref: "@I1@",
          childXrefs: ["@I2@"],
        }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "INDI", xref: "@I0@" });

    expect(result.individuals["@I0@"]).toBeUndefined();
    expect(result.families["@F0@"]).toMatchObject({
      husbandXref: "",
      wifeXref: "@I1@",
      childXrefs: ["@I2@"],
    });
  });

  it("removes a deleted individual from every fact's sharedWith list", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I0@": newGedcomIndividual({
          xref: "@I0@",
          facts: [
            newGedcomFact({
              tag: "BIRT",
              sharedWith: [
                { xref: "@I1@", role: "Witness" },
                { xref: "@I2@", role: "Witness" },
              ],
            }),
          ],
        }),
        "@I1@": newGedcomIndividual({ xref: "@I1@" }),
      },
      families: {
        "@F0@": newGedcomFamily({
          xref: "@F0@",
          facts: [
            newGedcomFact({
              tag: "MARR",
              sharedWith: [{ xref: "@I1@", role: "Witness" }],
            }),
          ],
        }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "INDI", xref: "@I1@" });

    expect(result.individuals["@I0@"]?.facts[0]?.sharedWith).toEqual([
      { xref: "@I2@", role: "Witness" },
    ]);
    expect(result.families["@F0@"]?.facts[0]?.sharedWith).toEqual([]);
  });

  it("deletes a family and clears parentOf/childOf references on its members", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I0@": newGedcomIndividual({
          xref: "@I0@",
          parentOfFamilyXrefs: ["@F0@", "@F1@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          childOfFamilyXrefs: ["@F0@"],
        }),
      },
      families: {
        "@F0@": newGedcomFamily({ xref: "@F0@", husbandXref: "@I0@" }),
        "@F1@": newGedcomFamily({ xref: "@F1@", husbandXref: "@I0@" }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "FAM", xref: "@F0@" });

    expect(result.families["@F0@"]).toBeUndefined();
    expect(result.individuals["@I0@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
    expect(result.individuals["@I2@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("deletes a source and removes citations to it from individuals and families", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I0@": newGedcomIndividual({
          xref: "@I0@",
          sex: newGedcomSex({
            citations: [newGedcomSourceCitation({ sourceXref: "@S0@" })],
          }),
          names: [
            newGedcomName({
              givenName: "A",
              citations: [newGedcomSourceCitation({ sourceXref: "@S0@" })],
            }),
          ],
          facts: [
            newGedcomFact({
              tag: "BIRT",
              citations: [
                newGedcomSourceCitation({ sourceXref: "@S0@" }),
                newGedcomSourceCitation({ sourceXref: "@S1@" }),
              ],
            }),
          ],
        }),
      },
      families: {
        "@F0@": newGedcomFamily({
          xref: "@F0@",
          citations: [newGedcomSourceCitation({ sourceXref: "@S0@" })],
          facts: [
            newGedcomFact({
              tag: "MARR",
              citations: [newGedcomSourceCitation({ sourceXref: "@S0@" })],
            }),
          ],
        }),
      },
      sources: {
        "@S0@": newGedcomSource({ xref: "@S0@" }),
        "@S1@": newGedcomSource({ xref: "@S1@" }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "SOUR", xref: "@S0@" });

    expect(result.sources["@S0@"]).toBeUndefined();
    expect(result.individuals["@I0@"]?.sex.citations).toEqual([]);
    expect(result.individuals["@I0@"]?.names[0]?.citations).toEqual([]);
    expect(
      result.individuals["@I0@"]?.facts[0]?.citations.map((c) => c.sourceXref),
    ).toEqual(["@S1@"]);
    expect(result.families["@F0@"]?.citations).toEqual([]);
    expect(result.families["@F0@"]?.facts[0]?.citations).toEqual([]);
  });

  it("deletes a repository and removes repository links to it from sources", () => {
    const database = newGedcomDatabase({
      sources: {
        "@S0@": newGedcomSource({
          xref: "@S0@",
          repositoryLinks: [
            newGedcomRepositoryLink({ repositoryXref: "@R0@" }),
            newGedcomRepositoryLink({ repositoryXref: "@R1@" }),
          ],
        }),
      },
      repositories: {
        "@R0@": newGedcomRepository({ xref: "@R0@" }),
        "@R1@": newGedcomRepository({ xref: "@R1@" }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "REPO", xref: "@R0@" });

    expect(result.repositories["@R0@"]).toBeUndefined();
    expect(
      result.sources["@S0@"]?.repositoryLinks.map((l) => l.repositoryXref),
    ).toEqual(["@R1@"]);
  });

  it("deletes multimedia and removes links to it from sources and citations", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I0@": newGedcomIndividual({
          xref: "@I0@",
          facts: [
            newGedcomFact({
              tag: "BIRT",
              citations: [
                newGedcomSourceCitation({
                  sourceXref: "@S0@",
                  multimediaLinks: [newGedcomMultimediaLink({ xref: "@M0@" })],
                }),
              ],
            }),
          ],
        }),
      },
      sources: {
        "@S0@": newGedcomSource({
          xref: "@S0@",
          multimediaLinks: [
            newGedcomMultimediaLink({ xref: "@M0@" }),
            newGedcomMultimediaLink({ xref: "@M1@" }),
          ],
        }),
      },
      multimedias: {
        "@M0@": newGedcomMultimedia({ xref: "@M0@" }),
        "@M1@": newGedcomMultimedia({ xref: "@M1@" }),
      },
    });

    const result = deleteGedcomRecord(database, { type: "OBJE", xref: "@M0@" });

    expect(result.multimedias["@M0@"]).toBeUndefined();
    expect(result.sources["@S0@"]?.multimediaLinks.map((l) => l.xref)).toEqual([
      "@M1@",
    ]);
    expect(
      result.individuals["@I0@"]?.facts[0]?.citations[0]?.multimediaLinks,
    ).toEqual([]);
  });

  it("does not mutate the original database", () => {
    const database = newGedcomDatabase({
      individuals: { "@I0@": newGedcomIndividual({ xref: "@I0@" }) },
    });

    deleteGedcomRecord(database, { type: "INDI", xref: "@I0@" });

    expect(database.individuals["@I0@"]).toBeDefined();
  });
});
