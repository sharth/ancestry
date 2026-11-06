import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { unusedMultimedia } from "./unused-multimedia.util";

describe("unusedMultimedia", () => {
  const multimedias = Object.fromEntries(
    ["@M1@", "@M2@", "@M3@", "@M4@", "@M5@"].map((xref) => [
      xref,
      newGedcomMultimedia({ xref }),
    ]),
  );

  it("lists every multimedia when nothing links to any of them", () => {
    const database = newGedcomDatabase({ multimedias });
    expect(unusedMultimedia(database).map((m) => m.xref)).toEqual([
      "@M1@",
      "@M2@",
      "@M3@",
      "@M4@",
      "@M5@",
    ]);
  });

  it("leaves out multimedia linked from sources, citations and unparsed OBJE records", () => {
    const citation = (xref: string) =>
      newGedcomSourceCitation({
        sourceXref: "@S1@",
        multimediaLinks: [newGedcomMultimediaLink({ xref })],
      });
    const individual = newGedcomIndividual({
      xref: "@I1@",
      unknownRecords: [newGedcomRecord({ tag: "OBJE", value: "@M3@" })],
    });
    individual.sex.citations.push(citation("@M2@"));
    const database = newGedcomDatabase({
      multimedias,
      individuals: { [individual.xref]: individual },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          citations: [citation("@M4@")],
        }),
      },
      sources: {
        "@S1@": newGedcomSource({
          xref: "@S1@",
          multimediaLinks: [newGedcomMultimediaLink({ xref: "@M1@" })],
        }),
      },
    });
    expect(unusedMultimedia(database).map((m) => m.xref)).toEqual(["@M5@"]);
  });
});
