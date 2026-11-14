import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomExternalIdentifier } from "../../gedcom/gedcomExternalIdentifier";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import {
  ancestryPersonIdType,
  familySearchPersonIdType,
} from "../../util/external-identifier-link";
import {
  applyTreeIdSuggestion,
  treeIdsToConvert,
} from "./apply-tree-id-suggestion.util";

const familySearch = newGedcomExternalIdentifier({
  id: "GQ8J-538",
  type: familySearchPersonIdType,
});
const ancestry = newGedcomExternalIdentifier({
  id: "132395462563",
  type: ancestryPersonIdType("183714515"),
});

describe("treeIdsToConvert", () => {
  it("converts _FSFTID and _AMTID", () => {
    const individual = newGedcomIndividual({
      xref: "@I1@",
      unknownRecords: [
        newGedcomRecord({ tag: "_FSFTID", value: "GQ8J-538" }),
        newGedcomRecord({
          tag: "_AMTID",
          value: "132395462563:1030:183714515",
        }),
      ],
    });
    expect(treeIdsToConvert(individual)).toEqual([familySearch, ancestry]);
  });

  it("skips records it can't convert", () => {
    const individual = newGedcomIndividual({
      xref: "@I1@",
      unknownRecords: [
        newGedcomRecord({
          tag: "_FSFTID",
          value: "LZ12-345",
          children: [newGedcomRecord({ tag: "_FOO" })],
        }),
        newGedcomRecord({ tag: "_AMTID", value: "1:9999:2" }),
        newGedcomRecord({ tag: "_AMTID", value: "garbage" }),
        newGedcomRecord({ tag: "_UID", value: "x" }),
      ],
    });
    expect(treeIdsToConvert(individual)).toEqual([]);
  });
});

describe("applyTreeIdSuggestion", () => {
  it("moves _FSFTID and _AMTID into EXIDs", () => {
    const uid = newGedcomRecord({ tag: "_UID", value: "x" });
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          unknownRecords: [
            uid,
            newGedcomRecord({ tag: "_FSFTID", value: "GQ8J-538" }),
            newGedcomRecord({
              tag: "_AMTID",
              value: "132395462563:1030:183714515",
            }),
          ],
        }),
      },
    });
    const updated = applyTreeIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]?.unknownRecords).toEqual([uid]);
    expect(updated.individuals["@I1@"]?.externalIdentifiers).toEqual([
      familySearch,
      ancestry,
    ]);
  });

  it("doesn't duplicate an EXID the individual already has", () => {
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          externalIdentifiers: [familySearch],
          unknownRecords: [
            newGedcomRecord({ tag: "_FSFTID", value: "GQ8J-538" }),
          ],
        }),
      },
    });
    const updated = applyTreeIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]?.externalIdentifiers).toEqual([
      familySearch,
    ]);
    expect(updated.individuals["@I1@"]?.unknownRecords).toEqual([]);
  });

  it("leaves individuals without tree ids untouched", () => {
    const database = newGedcomDatabase({
      individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
    });
    const updated = applyTreeIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]).toBe(database.individuals["@I1@"]);
  });
});
