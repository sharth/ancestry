import type {
  GedcomFamily,
  GedcomHeader,
  GedcomIndividual,
  GedcomMultimedia,
  GedcomRecord,
  GedcomRepository,
  GedcomSource,
  GedcomSubmitter,
  GedcomTrailer,
} from ".";
import {
  parseGedcomFamily,
  parseGedcomHeader,
  parseGedcomIndividual,
  parseGedcomMultimedia,
  parseGedcomRecords,
  parseGedcomRepository,
  parseGedcomSource,
  parseGedcomSubmitter,
  parseGedcomTrailer,
  serializeGedcomFamily,
  serializeGedcomHeader,
  serializeGedcomIndividual,
  serializeGedcomMultimedia,
  serializeGedcomRecordToText,
  serializeGedcomRepository,
  serializeGedcomSource,
  serializeGedcomSubmitter,
  serializeGedcomTrailer,
} from ".";

const testCases: {
  name: string;
  gedcom: string[];
  serializedGedcom?: string[];
  database: Database;
}[] = [
  {
    name: "Source",
    gedcom: ["0 @S1@ SOUR"],
    database: {
      sources: [
        {
          xref: "@S1@",
          repositoryCitations: [],
          unknownRecords: [],
          multimediaLinks: [],
          canonicalGedcomRecord: {
            xref: "@S1@",
            tag: "SOUR",
            abstag: "SOUR",
            value: undefined,
            children: [],
          },
        },
      ],
    },
  },
  {
    name: "Source with some fields",
    gedcom: [
      "0 @S10@ SOUR",
      "1 ABBR abbr",
      "1 TITL title",
      "1 _TMPLT",
      "2 TID 72",
      "1 TEXT text ",
      "2 CONC and more text",
    ],
    serializedGedcom: [
      "0 @S10@ SOUR",
      "1 ABBR abbr",
      "1 TITL title",
      "1 _TMPLT",
      "2 TID 72",
      "1 TEXT text and more text",
    ],
    database: {
      sources: [
        {
          xref: "@S10@",
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
          canonicalGedcomRecord: {
            xref: "@S10@",
            tag: "SOUR",
            abstag: "SOUR",
            value: undefined,
            children: [
              {
                xref: undefined,
                tag: "ABBR",
                abstag: "SOUR.ABBR",
                value: "abbr",
                children: [],
              },
              {
                xref: undefined,
                tag: "TITL",
                abstag: "SOUR.TITL",
                value: "title",
                children: [],
              },
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
              {
                xref: undefined,
                tag: "TEXT",
                abstag: "SOUR.TEXT",
                value: "text and more text",
                children: [],
              },
            ],
          },
        },
      ],
    },
  },

  {
    name: "Family with no parents",
    gedcom: ["0 @F1@ FAM"],
    database: {
      families: [
        {
          xref: "@F1@",
          childXrefs: [],
          events: [],
          gedcomRecord: {
            xref: "@F1@",
            tag: "FAM",
            abstag: "FAM",
            value: undefined,
            children: [],
          },
        },
      ],
    },
  },

  {
    name: "Family with both parents",
    gedcom: ["0 @F3@ FAM", "1 WIFE @I2@", "1 HUSB @I3@"],
    database: {
      families: [
        {
          xref: "@F3@",
          wifeXref: "@I2@",
          husbandXref: "@I3@",
          childXrefs: [],
          events: [],
          gedcomRecord: {
            xref: "@F3@",
            tag: "FAM",
            abstag: "FAM",
            value: undefined,
            children: [
              {
                xref: undefined,
                tag: "WIFE",
                abstag: "FAM.WIFE",
                value: "@I2@",
                children: [],
              },
              {
                xref: undefined,
                tag: "HUSB",
                abstag: "FAM.HUSB",
                value: "@I3@",
                children: [],
              },
            ],
          },
        },
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

testCases.forEach((testCase) => {
  it(testCase.name, () => {
    const gedcomRecords = parseGedcomRecords(testCase.gedcom.join("\n"));
    const database: Database = {};
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

    expect(database).toEqual(testCase.database);

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
