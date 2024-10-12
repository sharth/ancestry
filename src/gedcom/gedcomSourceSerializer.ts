import { GedcomRecord } from "./gedcomRecord";
import type { GedcomSource } from "./gedcomSource";

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
