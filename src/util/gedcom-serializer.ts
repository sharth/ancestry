import type {
  GedcomCitation,
  GedcomEvent,
  GedcomFamily,
  GedcomHeader,
  GedcomIndividual,
  GedcomMultimedia,
  GedcomRepository,
  GedcomSource,
  GedcomTrailer,
} from "../gedcom";
import { GedcomRecord } from "../gedcom";

export function serializeGedcomTrailer(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gedcomTrailer: GedcomTrailer
): GedcomRecord {
  return new GedcomRecord(undefined, "TRLR", "TRLR", undefined, []);
}

export function serializeGedcomMultimedia(
  gedcomMultimedia: GedcomMultimedia
): GedcomRecord {
  return new GedcomRecord(gedcomMultimedia.xref, "OBJE", "OBJE", undefined, [
    new GedcomRecord(
      undefined,
      "FILE",
      "OBJE.FILE",
      gedcomMultimedia.filePath,
      [
        new GedcomRecord(
          undefined,
          "FORM",
          "OBJE.FILE.FORM",
          gedcomMultimedia.mediaType,
          []
        ),
      ]
    ),
  ]);
}

export function serializeGedcomSource(source: GedcomSource): GedcomRecord {
  if (source.canonicalGedcomRecord) {
    return source.canonicalGedcomRecord;
  }

  return new GedcomRecord(
    source.xref,
    "SOUR",
    "SOUR",
    undefined,
    [
      source.abbr
        ? new GedcomRecord(undefined, "ABBR", "SOUR.ABBR", source.abbr, [])
        : null,
      source.title
        ? new GedcomRecord(undefined, "TITL", "SOUR.TITL", source.title, [])
        : null,
      source.text
        ? new GedcomRecord(undefined, "TEXT", "SOUR.TEXT", source.text, [])
        : null,
      ...source.repositoryCitations.map(
        (repositoryCitation) =>
          new GedcomRecord(
            undefined,
            "REPO",
            "SOUR.REPO",
            repositoryCitation.repositoryXref,
            repositoryCitation.callNumbers.map(
              (callNumber) =>
                new GedcomRecord(
                  undefined,
                  "CALN",
                  "SOUR.REPO.CALN",
                  callNumber,
                  []
                )
            )
          )
      ),
      ...source.unknownRecords,
    ].filter((record) => record !== null)
  );
}

export function serializeGedcomRecordToText(
  gedcomRecord: GedcomRecord,
  level = 0
): string[] {
  const [firstValue, ...remainingValues] =
    gedcomRecord.value?.split("\n") ?? [];
  return [
    `${level}` +
      (gedcomRecord.xref ? ` ${gedcomRecord.xref}` : "") +
      ` ${gedcomRecord.tag}` +
      (firstValue ? ` ${firstValue}` : ""),
    ...remainingValues.map(
      (nextValue) => `${level + 1} CONT` + (nextValue ? ` ${nextValue}` : "")
    ),
    ...gedcomRecord.children.flatMap((record) =>
      serializeGedcomRecordToText(record, level + 1)
    ),
  ];
}

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual
): GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return new GedcomRecord(
    gedcomIndividual.xref,
    "INDI",
    "INDI",
    undefined,
    [
      serializeFamilySearchId(gedcomIndividual),
      serializeSex(gedcomIndividual),
      // TODO: Serialize events, name, surname
    ].filter((record) => record !== null)
  );
}

function serializeFamilySearchId(
  gedcomIndividual: GedcomIndividual
): GedcomRecord | null {
  if (gedcomIndividual.familySearchId == null) {
    return null;
  } else {
    return new GedcomRecord(
      undefined,
      "_FSFTID",
      "INDI._FSFTID",
      gedcomIndividual.familySearchId,
      []
    );
  }
}

function serializeSex(gedcomIndividual: GedcomIndividual): GedcomRecord | null {
  switch (gedcomIndividual.sex) {
    case undefined:
      return null;
    case "Male":
      return new GedcomRecord(undefined, "SEX", "INDI.SEX", "M", []);
    case "Female":
      return new GedcomRecord(undefined, "SEX", "INDI.SEX", "F", []);
  }
}

export function serializeGedcomFamily(gedcomFamily: GedcomFamily) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return new GedcomRecord(gedcomFamily.xref, "FAM", "FAM", undefined, [
      // TODO: Fill in.
    ]);
  }
}

export function serializeGedcomCitation(
  gedcomCitation: GedcomCitation
): GedcomRecord {
  if (gedcomCitation.gedcomRecord) {
    return gedcomCitation.gedcomRecord;
  }
  return new GedcomRecord(
    undefined,
    "SOUR",
    "",
    gedcomCitation.sourceXref,
    [
      gedcomCitation.obje
        ? new GedcomRecord(undefined, "OBJE", "", gedcomCitation.obje, [])
        : null,
      gedcomCitation.name
        ? new GedcomRecord(undefined, "NAME", "", gedcomCitation.name, [])
        : null,
      gedcomCitation.note
        ? new GedcomRecord(undefined, "NOTE", "", gedcomCitation.note, [])
        : null,
      gedcomCitation.page
        ? new GedcomRecord(undefined, "PAGE", "", gedcomCitation.page, [])
        : null,
      gedcomCitation.text
        ? new GedcomRecord(undefined, "DATA", "", undefined, [
            new GedcomRecord(undefined, "TEXT", "", gedcomCitation.text, []),
          ])
        : null,
    ].filter((record) => record != null)
  );
}

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  if (gedcomEvent.gedcomRecord) {
    return gedcomEvent.gedcomRecord;
  } else {
    // TODO: Build something useful.
    return new GedcomRecord(undefined, "EVEN", "EVEN", undefined, []);
  }
}

export function serializeGedcomHeader(
  gedcomHeader: GedcomHeader
): GedcomRecord {
  return gedcomHeader.record;
}

export function serializeGedcomRepository(
  gedcomRepository: GedcomRepository
): GedcomRecord {
  return new GedcomRecord(
    gedcomRepository.xref,
    "REPO",
    "REPO",
    undefined,
    [
      gedcomRepository.name
        ? new GedcomRecord(
            undefined,
            "NAME",
            "REPO.NAME",
            gedcomRepository.name,
            []
          )
        : null,
    ].filter((record) => record != null)
  );
}
