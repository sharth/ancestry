import { beforeAll, describe, expect, it } from "vitest";
import { newGedcomEvent } from "./gedcomEvent";
import {
  newGedcomFamily,
  parseGedcomFamily,
  serializeGedcomFamily,
  type GedcomFamily,
} from "./gedcomFamily";
import {
  parseGedcomHeader,
  serializeGedcomHeader,
  type GedcomHeader,
} from "./gedcomHeader";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
  type GedcomIndividual,
} from "./gedcomIndividual";
import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
  type GedcomMultimedia,
} from "./gedcomMultimedia";
import { newGedcomName } from "./gedcomName";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import {
  parseGedcomRepository,
  serializeGedcomRepository,
  type GedcomRepository,
} from "./gedcomRepository";
import {
  parseGedcomSource,
  serializeGedcomSource,
  type GedcomSource,
} from "./gedcomSource";
import { newGedcomSourceCitation } from "./gedcomSourceCitation";
import {
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
  type GedcomSubmitter,
} from "./gedcomSubmitter";
import {
  parseGedcomTrailer,
  serializeGedcomTrailer,
  type GedcomTrailer,
} from "./gedcomTrailer";

const testCases: {
  name: string;
  gedcom: string[];
  serializedGedcom?: string[];
  database: Database;
}[] = [
  {
    name: "Individual",
    gedcom: [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "2 SOUR @S1@",
      "2 SOUR @S2@",
      "3 QUAY 3",
      "2 SOUR @S3@",
      "3 PAGE page",
      "3 QUAY 3",
      "3 DATA",
      "4 TEXT text",
      "0 @I2@ INDI",
      "1 SEX M",
      "0 @I3@ INDI",
      "1 SEX F",
      "2 SOUR @S50@",
      "0 @I4@ INDI",
      "0 @I5@ INDI",
      "1 IDNO abcd",
      "2 TYPE familysearch.org",
      "1 BIRT",
      "2 CAUS normal",
      "2 DATE ABT 1 Jan 2000",
      "2 SDATE 1 Jan 2000",
      "2 PLAC place",
      "2 ADDR address",
      "2 SOUR @S1@",
      "1 OCCU Truck Driver",
      "2 TYPE Permanent",
      "0 @I6@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "2 NSFX Jr",
      "2 TYPE Traditional",
      "0 @I7@ INDI",
      "1 CHAN",
      "2 DATE 1 Jan 2000",
      "0 @I8@ INDI",
      "1 FAMS @F1@",
      "1 FAMC @F2@",
      "0 @I9@ INDI",
      "1 CENS Y",
      "2 _SHAR @I7@",
      "2 _SHAR @I8@",
      "3 ROLE Friend",
    ],
    database: {
      individuals: [
        newGedcomIndividual({
          xref: "@I1@",
          names: [
            newGedcomName({
              givenName: "John",
              surname: "Doe",
              citations: [
                newGedcomSourceCitation({
                  sourceXref: "@S1@",
                }),
                newGedcomSourceCitation({
                  sourceXref: "@S2@",
                  quality: "3",
                }),
                newGedcomSourceCitation({
                  sourceXref: "@S3@",
                  text: "text",
                  page: "page",
                  quality: "3",
                }),
              ],
            }),
          ],
        }),
        newGedcomIndividual({
          xref: "@I2@",
          sex: { sex: "M", citations: [] },
        }),
        newGedcomIndividual({
          xref: "@I3@",
          sex: {
            sex: "F",
            citations: [
              newGedcomSourceCitation({
                sourceXref: "@S50@",
              }),
            ],
          },
        }),
        newGedcomIndividual({
          xref: "@I4@",
        }),
        newGedcomIndividual({
          xref: "@I5@",
          events: [
            newGedcomEvent({
              tag: "IDNO",
              value: "abcd",
              type: "familysearch.org",
            }),
            newGedcomEvent({
              tag: "BIRT",
              place: "place",
              address: "address",
              cause: "normal",
              date: { value: "ABT 1 Jan 2000" },
              sortDate: { value: "1 Jan 2000" },
              citations: [
                newGedcomSourceCitation({
                  sourceXref: "@S1@",
                }),
              ],
            }),
            newGedcomEvent({
              tag: "OCCU",
              value: "Truck Driver",
              type: "Permanent",
            }),
          ],
        }),
        newGedcomIndividual({
          xref: "@I6@",
          names: [
            newGedcomName({
              givenName: "John",
              surname: "Doe",
              suffix: "Jr",
              nameType: "Traditional",
            }),
          ],
        }),

        newGedcomIndividual({
          xref: "@I7@",
          changeDate: { date: { value: "1 Jan 2000" } },
        }),
        newGedcomIndividual({
          xref: "@I8@",
          parentOfFamilyXrefs: ["@F1@"],
          childOfFamilyXrefs: ["@F2@"],
        }),
        newGedcomIndividual({
          xref: "@I9@",
          events: [
            newGedcomEvent({
              tag: "CENS",
              sharedWith: [
                { xref: "@I7@", role: "" },
                { xref: "@I8@", role: "Friend" },
              ],
            }),
          ],
        }),
      ],
    },
  },
  {
    name: "Family",
    gedcom: ["0 @F1@ FAM", "0 @F3@ FAM", "1 HUSB @I3@", "1 WIFE @I2@"],
    database: {
      families: [
        newGedcomFamily({
          xref: "@F1@",
        }),

        newGedcomFamily({
          xref: "@F3@",
          wifeXref: "@I2@",
          husbandXref: "@I3@",
        }),
      ],
    },
  },
];

interface Database {
  headers?: GedcomHeader[];
  submitters?: GedcomSubmitter[];
  trailers?: GedcomTrailer[];
  individuals?: GedcomIndividual[];
  families?: GedcomFamily[];
  repositories?: GedcomRepository[];
  sources?: GedcomSource[];
  multimedia?: GedcomMultimedia[];
}

describe("Gedcom Tests", () => {
  testCases.forEach((testCase) => {
    describe(testCase.name, () => {
      const database: Database = {};

      beforeAll(() => {
        const gedcomRecords = parseGedcomRecords(testCase.gedcom.join("\n"));

        gedcomRecords.forEach((gedcomRecord) => {
          switch (gedcomRecord.tag) {
            case "HEAD":
              database.headers ??= [];
              database.headers.push(parseGedcomHeader(gedcomRecord));
              break;
            case "SUBM":
              database.submitters ??= [];
              database.submitters.push(parseGedcomSubmitter(gedcomRecord));
              break;
            case "INDI":
              database.individuals ??= [];
              database.individuals.push(parseGedcomIndividual(gedcomRecord));
              break;
            case "FAM":
              database.families ??= [];
              database.families.push(parseGedcomFamily(gedcomRecord));
              break;
            case "REPO":
              database.repositories ??= [];
              database.repositories.push(parseGedcomRepository(gedcomRecord));
              break;
            case "SOUR":
              database.sources ??= [];
              database.sources.push(parseGedcomSource(gedcomRecord));
              break;
            case "OBJE":
              database.multimedia ??= [];
              database.multimedia.push(parseGedcomMultimedia(gedcomRecord));
              break;
            case "TRLR":
              database.trailers ??= [];
              database.trailers.push(parseGedcomTrailer(gedcomRecord));
              break;
          }
        });
      });

      it("Verify Database", () => {
        expect(database).toEqual(testCase.database);
      });

      it("Serialize Database", () => {
        const serializedRecords: string[] = [
          database.headers?.map((header) => serializeGedcomHeader(header)),
          database.submitters?.map((subm) => serializeGedcomSubmitter(subm)),
          database.individuals?.map((indi) => serializeGedcomIndividual(indi)),
          database.families?.map((fam) => serializeGedcomFamily(fam)),
          database.repositories?.map((repo) => serializeGedcomRepository(repo)),
          database.sources?.map((sour) => serializeGedcomSource(sour)),
          database.multimedia?.map((obje) => serializeGedcomMultimedia(obje)),
          database.trailers?.map((trlr) => serializeGedcomTrailer(trlr)),
        ]
          .filter((record) => record != null)
          .flat()
          .flatMap((record) => serializeGedcomRecordToText(record));

        expect(serializedRecords).toEqual(
          testCase.serializedGedcom ?? testCase.gedcom,
        );
      });
    });
  });
});
