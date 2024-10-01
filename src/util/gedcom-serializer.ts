import * as gedcom from "../gedcom";

export function serializeGedcomTrailerToGedcomRecord(
  gedcomTrailer: gedcom.GedcomTrailer
): gedcom.GedcomRecord {
  return new gedcom.GedcomRecord(0, undefined, "TRLR", "TRLR", undefined, []);
}

export function serializeGedcomSourceToGedcomRecord(
  source: gedcom.GedcomSource
): gedcom.GedcomRecord {
  if (source.canonicalGedcomRecord) {
    return source.canonicalGedcomRecord;
  }

  return new gedcom.GedcomRecord(
    0,
    source.xref,
    "SOUR",
    "SOUR",
    undefined,
    [
      source.abbr
        ? new gedcom.GedcomRecord(
            1,
            undefined,
            "ABBR",
            "SOUR.ABBR",
            source.abbr,
            []
          )
        : null,
      source.title
        ? new gedcom.GedcomRecord(
            1,
            undefined,
            "TITL",
            "SOUR.TITL",
            source.title,
            []
          )
        : null,
      source.text
        ? new gedcom.GedcomRecord(
            1,
            undefined,
            "TEXT",
            "SOUR.TEXT",
            source.text,
            []
          )
        : null,
      ...source.repositoryCitations.map(
        (repositoryCitation) =>
          new gedcom.GedcomRecord(
            1,
            undefined,
            "REPO",
            "SOUR.REPO",
            repositoryCitation.repositoryXref,
            repositoryCitation.callNumbers.map(
              (callNumber) =>
                new gedcom.GedcomRecord(
                  2,
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
  gedcomRecord: gedcom.GedcomRecord
): string[] {
  const [firstValue, ...remainingValues] =
    gedcomRecord.value?.split("\n") ?? [];
  return [
    `${gedcomRecord.level}` +
      (gedcomRecord.xref ? ` ${gedcomRecord.xref}` : "") +
      ` ${gedcomRecord.tag}` +
      (firstValue ? ` ${firstValue}` : ""),
    ...remainingValues.map(
      (nextValue) =>
        `${gedcomRecord.level + 1} CONT` + (nextValue ? ` ${nextValue}` : "")
    ),
    ...gedcomRecord.children.flatMap(serializeGedcomRecordToText),
  ];
}

export function serializeGedcomIndividualToGedcomRecord(
  gedcomIndividual: gedcom.GedcomIndividual
): gedcom.GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return new gedcom.GedcomRecord(
    0,
    gedcomIndividual.xref,
    "INDI",
    "INDI",
    undefined,
    [
      serializeFamilySearchIdToGedcomRecord(gedcomIndividual),
      serializeSexToGedcomRecord(gedcomIndividual),
      // TODO: Serialize events, name, surname
    ].filter((record) => record !== null)
  );
}

function serializeFamilySearchIdToGedcomRecord(
  gedcomIndividual: gedcom.GedcomIndividual
): gedcom.GedcomRecord | null {
  if (gedcomIndividual.familySearchId == null) {
    return null;
  } else {
    return new gedcom.GedcomRecord(
      1,
      undefined,
      "_FSFTID",
      "INDI._FSFTID",
      gedcomIndividual.familySearchId,
      []
    );
  }
}

function serializeSexToGedcomRecord(
  gedcomIndividual: gedcom.GedcomIndividual
): gedcom.GedcomRecord | null {
  switch (gedcomIndividual.sex) {
    case undefined:
      return null;
    case "Male":
      return new gedcom.GedcomRecord(1, undefined, "SEX", "INDI.SEX", "M", []);
    case "Female":
      return new gedcom.GedcomRecord(1, undefined, "SEX", "INDI.SEX", "F", []);
  }
}

export function serializeGedcomFamilyToGedcomRecord(
  gedcomFamily: gedcom.GedcomFamily
) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return new gedcom.GedcomRecord(
      0,
      gedcomFamily.xref,
      "FAM",
      "FAM",
      undefined,
      [
        // TODO: Fill in.
      ]
    );
  }
}

export function serializeGedcomCitationToGedcomRecord(
  gedcomCitation: gedcom.GedcomCitation,
  level: number
): gedcom.GedcomRecord {
  if (gedcomCitation.gedcomRecord) {
    return gedcomCitation.gedcomRecord;
  }
  return new gedcom.GedcomRecord(
    level,
    undefined,
    "SOUR",
    "",
    gedcomCitation.sourceXref,
    [
      gedcomCitation.obje
        ? new gedcom.GedcomRecord(
            level + 1,
            undefined,
            "OBJE",
            "",
            gedcomCitation.obje,
            []
          )
        : null,
      gedcomCitation.name
        ? new gedcom.GedcomRecord(
            level + 1,
            undefined,
            "NAME",
            "",
            gedcomCitation.name,
            []
          )
        : null,
      gedcomCitation.note
        ? new gedcom.GedcomRecord(
            level + 1,
            undefined,
            "NOTE",
            "",
            gedcomCitation.note,
            []
          )
        : null,
      gedcomCitation.page
        ? new gedcom.GedcomRecord(
            level + 1,
            undefined,
            "PAGE",
            "",
            gedcomCitation.page,
            []
          )
        : null,
      gedcomCitation.text
        ? new gedcom.GedcomRecord(level + 1, undefined, "DATA", "", undefined, [
            new gedcom.GedcomRecord(
              level + 2,
              undefined,
              "TEXT",
              "",
              gedcomCitation.text,
              []
            ),
          ])
        : null,
    ].filter((record) => record != null)
  );
}

export function serializeGedcomEventToGedcomRecord(
  gedcomEvent: gedcom.GedcomEvent
): gedcom.GedcomRecord {
  if (gedcomEvent.gedcomRecord) {
    return gedcomEvent.gedcomRecord;
  } else {
    // TODO: Build something useful.
    return new gedcom.GedcomRecord(0, undefined, "EVEN", "EVEN", undefined, []);
  }
}

export function serializeGedcomHeaderToGedcomRecord(
  gedcomHeader: gedcom.GedcomHeader
): gedcom.GedcomRecord {
  return gedcomHeader.record;
}

export function serializeGedcomRepositoryToGedcomRecord(
  gedcomRepository: gedcom.GedcomRepository
): gedcom.GedcomRecord {
  return new gedcom.GedcomRecord(
    0,
    gedcomRepository.xref,
    "REPO",
    "REPO",
    undefined,
    [
      gedcomRepository.name
        ? new gedcom.GedcomRecord(
            1,
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
