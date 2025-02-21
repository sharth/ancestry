import type { GedcomFamily } from "./gedcomFamily";
import { parseGedcomFamily, serializeGedcomFamily } from "./gedcomFamily";
import type { GedcomHeader } from "./gedcomHeader";
import { parseGedcomHeader, serializeGedcomHeader } from "./gedcomHeader";
import type { GedcomIndividual } from "./gedcomIndividual";
import {
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import type { GedcomMultimedia } from "./gedcomMultimedia";
import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
} from "./gedcomMultimedia";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import type { GedcomRepository } from "./gedcomRepository";
import {
  parseGedcomRepository,
  serializeGedcomRepository,
} from "./gedcomRepository";
import type { GedcomSource } from "./gedcomSource";
import { parseGedcomSource, serializeGedcomSource } from "./gedcomSource";
import type { GedcomSubmitter } from "./gedcomSubmitter";
import {
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
} from "./gedcomSubmitter";
import type { GedcomTrailer } from "./gedcomTrailer";
import { parseGedcomTrailer, serializeGedcomTrailer } from "./gedcomTrailer";

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
      "3 OBJE google.com",
      "3 NAME name",
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
      "1 _FSFTID abcd",
      "1 BIRT",
      "2 DATE ABT 1 Jan 2000",
      "2 SDATE 1 Jan 2000",
      "2 PLAC place",
      "2 ADDR address",
      "2 CAUS normal",
      "2 SOUR @S1@",
      "1 OCCU Truck Driver",
      "2 TYPE Permanent",
      "0 @I6@ INDI",
      "1 NAME John /Doe/ Jr",
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
      "1 CENS",
      "2 _SHAR @I7@",
      "2 _SHAR @I8@",
      "3 ROLE Friend",
    ],
    database: {
      individuals: [
        {
          xref: "@I1@",
          names: [
            {
              prefix: undefined,
              givenName: "John",
              nickName: undefined,
              surnamePrefix: undefined,
              surname: "Doe",
              suffix: undefined,
              nameType: undefined,
              citations: [
                {
                  sourceXref: "@S1@",
                },
                {
                  sourceXref: "@S2@",
                  quality: "3",
                },
                {
                  sourceXref: "@S3@",
                  name: "name",
                  obje: "google.com",
                  text: "text",
                  page: "page",
                  quality: "3",
                },
              ],
            },
          ],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I2@",
          sex: { sex: "M", citations: [] },
          names: [],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I3@",
          sex: { sex: "F", citations: [{ sourceXref: "@S50@" }] },
          names: [],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I4@",
          names: [],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I5@",
          names: [],
          events: [
            {
              tag: "BIRT",
              value: undefined,
              place: "place",
              address: "address",
              cause: "normal",
              date: { value: "ABT 1 Jan 2000" },
              sortDate: { value: "1 Jan 2000" },
              citations: [{ sourceXref: "@S1@" }],
              sharedWith: [],
            },
            {
              tag: "OCCU",
              value: "Truck Driver",
              type: "Permanent",
              citations: [],
              sharedWith: [],
            },
          ],
          familySearchId: "abcd",
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I6@",
          names: [
            {
              prefix: undefined,
              givenName: "John",
              nickName: undefined,
              surnamePrefix: undefined,
              surname: "Doe",
              suffix: "Jr",
              nameType: "Traditional",
              citations: [],
            },
          ],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I7@",
          changeDate: { value: "1 Jan 2000" },
          names: [],
          events: [],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
        {
          xref: "@I8@",
          names: [],
          events: [],
          parentOfFamilyXref: ["@F1@"],
          childOfFamilyXref: ["@F2@"],
        },
        {
          xref: "@I9@",
          names: [],
          events: [
            {
              tag: "CENS",
              value: undefined,
              citations: [],
              sharedWith: [{ xref: "@I7@" }, { xref: "@I8@", role: "Friend" }],
            },
          ],
          parentOfFamilyXref: [],
          childOfFamilyXref: [],
        },
      ],
    },
  },
  {
    name: "Source",
    gedcom: [
      "0 @S1@ SOUR",
      "0 @S2@ SOUR",
      "1 ABBR abbr",
      "1 TITL title",
      "1 TEXT text and more text",
      "1 _TMPLT",
      "2 TID 72",
    ],
    database: {
      sources: [
        {
          xref: "@S1@",
          repositoryCitations: [],
          unknownRecords: [],
          multimediaLinks: [],
        },
        {
          xref: "@S2@",
          abbr: "abbr",
          title: "title",
          text: "text and more text",
          multimediaLinks: [],
          repositoryCitations: [],
          unknownRecords: [
            {
              xref: undefined,
              tag: "_TMPLT",
              abstag: "SOUR._TMPLT",
              value: undefined,
              children: [
                {
                  xref: undefined,
                  tag: "TID",
                  abstag: "SOUR._TMPLT.TID",
                  value: "72",
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: "Family",
    gedcom: ["0 @F1@ FAM", "0 @F3@ FAM", "1 HUSB @I3@", "1 WIFE @I2@"],
    database: {
      families: [
        { xref: "@F1@", childXrefs: [], events: [] },
        {
          xref: "@F3@",
          wifeXref: "@I2@",
          husbandXref: "@I3@",
          childXrefs: [],
          events: [],
        },
      ],
    },
  },
  {
    name: "Submitter",
    gedcom: [
      "0 @X1@ SUBM",
      "0 @X2@ SUBM",
      "1 NAME John Doe",
      "1 _EMAIL johndoe@example.com",
    ],
    database: {
      submitters: [
        { xref: "@X1@" },
        {
          xref: "@X2@",
          name: "John Doe",
          email: "johndoe@example.com",
        },
      ],
    },
  },
  {
    name: "CONC and CONT",
    gedcom: [
      "0 @X1@ SUBM",
      "1 NAME Jo",
      "2 CONC hn",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 NAME",
      "2 CONC johndoe@example.com",
      "0 @X3@ SUBM",
      "1 NAME",
      "2 CONT John",
      "2 CONT Doe",
    ],
    serializedGedcom: [
      "0 @X1@ SUBM",
      "1 NAME John",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 NAME johndoe@example.com",
      "0 @X3@ SUBM",
      "1 NAME",
      "2 CONT John",
      "2 CONT Doe",
    ],
    database: {
      submitters: [
        { xref: "@X1@", name: "John\nDoe" },
        { xref: "@X2@", name: "johndoe@example.com" },
        { xref: "@X3@", name: "\nJohn\nDoe" },
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
          testCase.serializedGedcom ?? testCase.gedcom
        );
      });
    });
  });
});
