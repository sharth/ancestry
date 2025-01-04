import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomRepository } from "./gedcomRepository";

export function serializeGedcomRepository(
  gedcomRepository: GedcomRepository
): GedcomRecord {
  return {
    xref: gedcomRepository.xref,
    tag: "REPO",
    abstag: "REPO",
    children: [
      {
        tag: "NAME",
        abstag: "REPO.NAME",
        value: gedcomRepository.name,
        children: [],
      },
    ].filter((record) => record.children.length || record.value),
  };
}
