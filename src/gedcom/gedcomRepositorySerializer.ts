import { GedcomRecord } from "./gedcomRecord";
import type { GedcomRepository } from "./gedcomRepository";

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
