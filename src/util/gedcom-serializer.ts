import * as gedcom from "../gedcom";

export function serializeGedcomTrailerToGedcomRecord(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gedcomTrailer: gedcom.GedcomTrailer
): gedcom.GedcomRecord {
  return new gedcom.GedcomRecord(undefined, "TRLR", "TRLR", undefined, []);
}

export function serializeGedcomMultimediaToGedcomRecord(
  gedcomMultimedia: gedcom.GedcomMultimedia
): gedcom.GedcomRecord {
  return new gedcom.GedcomRecord(
    gedcomMultimedia.xref,
    "OBJE",
    "OBJE",
    undefined,
    [
      new gedcom.GedcomRecord(
        undefined,
        "FILE",
        "OBJE.FILE",
        gedcomMultimedia.filePath,
        [
          new gedcom.GedcomRecord(
            undefined,
            "FORM",
            "OBJE.FILE.FORM",
            gedcomMultimedia.mediaType,
            []
          ),
        ]
      ),
    ]
  );
}

export function serializeGedcomSourceToGedcomRecord(
  source: gedcom.GedcomSource
): gedcom.GedcomRecord {
  if (source.canonicalGedcomRecord) {
    return source.canonicalGedcomRecord;
  }

  return new gedcom.GedcomRecord(
    source.xref,
    "SOUR",
    "SOUR",
    undefined,
    [
      source.abbr
        ? new gedcom.GedcomRecord(
            undefined,
            "ABBR",
            "SOUR.ABBR",
            source.abbr,
            []
          )
        : null,
      source.title
        ? new gedcom.GedcomRecord(
            undefined,
            "TITL",
            "SOUR.TITL",
            source.title,
            []
          )
        : null,
      source.text
        ? new gedcom.GedcomRecord(
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
            undefined,
            "REPO",
            "SOUR.REPO",
            repositoryCitation.repositoryXref,
            repositoryCitation.callNumbers.map(
              (callNumber) =>
                new gedcom.GedcomRecord(
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
  gedcomRecord: gedcom.GedcomRecord,
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

export function serializeGedcomIndividualToGedcomRecord(
  gedcomIndividual: gedcom.GedcomIndividual
): gedcom.GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return new gedcom.GedcomRecord(
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
      return new gedcom.GedcomRecord(undefined, "SEX", "INDI.SEX", "M", []);
    case "Female":
      return new gedcom.GedcomRecord(undefined, "SEX", "INDI.SEX", "F", []);
  }
}

export function serializeGedcomFamilyToGedcomRecord(
  gedcomFamily: gedcom.GedcomFamily
) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return new gedcom.GedcomRecord(gedcomFamily.xref, "FAM", "FAM", undefined, [
      // TODO: Fill in.
    ]);
  }
}

export function serializeGedcomCitationToGedcomRecord(
  gedcomCitation: gedcom.GedcomCitation
): gedcom.GedcomRecord {
  if (gedcomCitation.gedcomRecord) {
    return gedcomCitation.gedcomRecord;
  }
  return new gedcom.GedcomRecord(
    undefined,
    "SOUR",
    "",
    gedcomCitation.sourceXref,
    [
      gedcomCitation.obje
        ? new gedcom.GedcomRecord(
            undefined,
            "OBJE",
            "",
            gedcomCitation.obje,
            []
          )
        : null,
      gedcomCitation.name
        ? new gedcom.GedcomRecord(
            undefined,
            "NAME",
            "",
            gedcomCitation.name,
            []
          )
        : null,
      gedcomCitation.note
        ? new gedcom.GedcomRecord(
            undefined,
            "NOTE",
            "",
            gedcomCitation.note,
            []
          )
        : null,
      gedcomCitation.page
        ? new gedcom.GedcomRecord(
            undefined,
            "PAGE",
            "",
            gedcomCitation.page,
            []
          )
        : null,
      gedcomCitation.text
        ? new gedcom.GedcomRecord(undefined, "DATA", "", undefined, [
            new gedcom.GedcomRecord(
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
    return new gedcom.GedcomRecord(undefined, "EVEN", "EVEN", undefined, []);
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
    gedcomRepository.xref,
    "REPO",
    "REPO",
    undefined,
    [
      gedcomRepository.name
        ? new gedcom.GedcomRecord(
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
