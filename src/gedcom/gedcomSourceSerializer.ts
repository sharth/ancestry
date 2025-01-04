import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSource } from "./gedcomSource";

export function serializeGedcomSource(source: GedcomSource): GedcomRecord {
  return {
    xref: source.xref,
    tag: "SOUR",
    abstag: "SOUR",
    children: [
      { tag: "ABBR", abstag: "SOUR.ABBR", value: source.abbr, children: [] },
      { tag: "TITL", abstag: "SOUR.TITL", value: source.title, children: [] },
      { tag: "TEXT", abstag: "SOUR.TEXT", value: source.text, children: [] },
      ...source.repositoryCitations.map((repositoryCitation) => ({
        tag: "REPO",
        abstag: "SOUR.REPO",
        value: repositoryCitation.repositoryXref,
        children: repositoryCitation.callNumbers.map((callNumber) => ({
          tag: "CALN",
          abstag: "SOUR.REPO.CALN",
          value: callNumber,
          children: [],
        })),
      })),
      ...source.unknownRecords,
    ].filter((record) => record.children.length || record.value),
  };
}
