import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import {
  gedcomRecordsEqual,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";

/** Sources to merge: the first in file order is kept, and the rest are
 * merged into it. */
export interface DuplicateSources {
  kept: GedcomSource;
  duplicates: GedcomSource[];
}

/** What a merge can't carry over from a duplicate because the kept source
 * already holds a different value there, e.g. "TEXT of @S2@". The kept
 * source's value wins, so these are listed for review before saving. */
export function mergeConflicts(group: DuplicateSources): string[] {
  const conflicts: string[] = [];
  for (const duplicate of group.duplicates) {
    const differs = (tag: string, kept: string, other: string) => {
      if (kept !== "" && other !== "" && kept !== other) {
        conflicts.push(`${tag} of ${duplicate.xref}`);
      }
    };
    differs("TITL", group.kept.title, duplicate.title);
    differs("TEXT", group.kept.text, duplicate.text);
    for (const record of duplicate.unknownRecords) {
      if (
        unknownRecordMerge(group.kept.unknownRecords, record) === "conflict"
      ) {
        conflicts.push(`${record.tag} of ${duplicate.xref}`);
      }
    }
  }
  return conflicts;
}

/** How a duplicate's unparsed record merges into the kept source's: dropped
 * when the kept source already has an identical one, moved over when the
 * kept source has none with that tag, and otherwise a conflict, since many
 * tags (AUTH, PUBL, ...) may only appear once. */
function unknownRecordMerge(
  keptRecords: readonly GedcomRecord[],
  record: GedcomRecord,
): "identical" | "move" | "conflict" {
  if (keptRecords.some((kept) => gedcomRecordsEqual(kept, record))) {
    return "identical";
  }
  if (keptRecords.some((kept) => kept.tag === record.tag)) return "conflict";
  return "move";
}

/** Merges each group's duplicates into its kept source: every citation of a
 * duplicate is repointed at the kept source, its repository links (with
 * their call numbers), multimedia links and unparsed records are carried
 * over without repeats, and the duplicate is deleted. Pure -- doesn't
 * mutate `database`, so it's safe to use both for a preview and as the
 * database handed to the GEDCOM editor for further review before saving. */
export function applyMergeDuplicateSources(
  database: GedcomDatabase,
  groups: readonly DuplicateSources[],
): GedcomDatabase {
  // Duplicate xref -> the kept source's xref.
  const replacements = new Map<string, string>();
  for (const group of groups) {
    for (const duplicate of group.duplicates) {
      replacements.set(duplicate.xref, group.kept.xref);
    }
  }
  if (replacements.size === 0) return database;

  return produce(database, (draft) => {
    for (const group of groups) {
      const kept = draft.sources[group.kept.xref];
      if (kept === undefined) continue;
      for (const duplicate of group.duplicates) {
        mergeSourceInto(kept, duplicate);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.sources[duplicate.xref];
      }
    }

    // Only the records that reference a duplicate are drafted, so a large
    // database isn't walked through immer proxies.
    for (const [xref, individual] of Object.entries(database.individuals)) {
      if (!individualReferences(individual, replacements)) continue;
      const draftIndividual = draft.individuals[xref];
      if (draftIndividual === undefined) continue;
      for (const owner of [
        draftIndividual.sex,
        ...draftIndividual.names,
        ...draftIndividual.facts,
      ]) {
        repointCitations(owner.citations, replacements);
      }
      repointUnknownRecords(draftIndividual.unknownRecords, replacements);
    }
    for (const [xref, family] of Object.entries(database.families)) {
      if (!familyReferences(family, replacements)) continue;
      const draftFamily = draft.families[xref];
      if (draftFamily === undefined) continue;
      for (const owner of [draftFamily, ...draftFamily.facts]) {
        repointCitations(owner.citations, replacements);
      }
      repointUnknownRecords(draftFamily.unknownRecords, replacements);
    }
    // A kept source may also have picked up a duplicate's unparsed records.
    const keptXrefs = new Set(groups.map((group) => group.kept.xref));
    for (const [xref, source] of Object.entries(database.sources)) {
      if (
        !keptXrefs.has(xref) &&
        !unknownRecordsReference(source.unknownRecords, replacements)
      ) {
        continue;
      }
      const draftSource = draft.sources[xref];
      if (draftSource === undefined) continue;
      repointUnknownRecords(draftSource.unknownRecords, replacements);
    }
  });
}

function mergeSourceInto(kept: GedcomSource, duplicate: GedcomSource) {
  if (kept.title === "") kept.title = duplicate.title;
  if (kept.text === "") kept.text = duplicate.text;

  for (const link of duplicate.repositoryLinks) {
    const keptLink = kept.repositoryLinks.find(
      (l) => l.repositoryXref === link.repositoryXref,
    );
    if (keptLink === undefined) {
      kept.repositoryLinks.push(structuredClone(link));
      continue;
    }
    for (const callNumber of link.callNumbers) {
      if (!keptLink.callNumbers.includes(callNumber)) {
        keptLink.callNumbers.push(callNumber);
      }
    }
  }

  for (const link of duplicate.multimediaLinks) {
    if (!kept.multimediaLinks.some((l) => l.xref === link.xref)) {
      kept.multimediaLinks.push(structuredClone(link));
    }
  }

  for (const record of duplicate.unknownRecords) {
    if (unknownRecordMerge(kept.unknownRecords, record) === "move") {
      kept.unknownRecords.push(structuredClone(record));
    }
  }
}

function citationsReference(
  citations: readonly GedcomSourceCitation[],
  replacements: ReadonlyMap<string, string>,
): boolean {
  return citations.some((citation) => replacements.has(citation.sourceXref));
}

function individualReferences(
  individual: GedcomIndividual,
  replacements: ReadonlyMap<string, string>,
): boolean {
  return (
    [individual.sex, ...individual.names, ...individual.facts].some((owner) =>
      citationsReference(owner.citations, replacements),
    ) || unknownRecordsReference(individual.unknownRecords, replacements)
  );
}

function familyReferences(
  family: GedcomFamily,
  replacements: ReadonlyMap<string, string>,
): boolean {
  return (
    [family, ...family.facts].some((owner) =>
      citationsReference(owner.citations, replacements),
    ) || unknownRecordsReference(family.unknownRecords, replacements)
  );
}

// e.g. INDI.SOUR, which isn't parsed into a typed field yet.
function unknownRecordsReference(
  records: readonly GedcomRecord[],
  replacements: ReadonlyMap<string, string>,
): boolean {
  return records.some(
    (record) =>
      (record.tag === "SOUR" && replacements.has(record.value)) ||
      unknownRecordsReference(record.children, replacements),
  );
}

function repointCitations(
  citations: GedcomSourceCitation[],
  replacements: ReadonlyMap<string, string>,
) {
  for (const citation of citations) {
    citation.sourceXref =
      replacements.get(citation.sourceXref) ?? citation.sourceXref;
  }
}

function repointUnknownRecords(
  records: GedcomRecord[],
  replacements: ReadonlyMap<string, string>,
) {
  for (const record of records) {
    if (record.tag === "SOUR") {
      record.value = replacements.get(record.value) ?? record.value;
    }
    repointUnknownRecords(record.children, replacements);
  }
}
