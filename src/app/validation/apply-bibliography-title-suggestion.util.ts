import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

/** The `_BIBL` (bibliography) value to move into an untitled source's TITL,
 * or undefined when there's nothing to move: the source already has a
 * title, or has no `_BIBL`, or its `_BIBL` carries child records of its
 * own (CONC/CONT are already folded into the value by the parser) that a
 * plain TITL has nowhere to keep. */
export function bibliographyForMissingTitle(
  source: GedcomSource,
): string | undefined {
  if (source.title !== "") return undefined;
  const bibliographies = source.unknownRecords.filter(
    (record) => record.tag === "_BIBL",
  );
  if (bibliographies.length !== 1) return undefined;
  const [bibliography] = bibliographies;
  if (bibliography === undefined) return undefined;
  if (bibliography.value === "" || bibliography.children.length > 0) {
    return undefined;
  }
  return bibliography.value;
}

/** Moves an untitled source's `_BIBL` into its TITL. URLs in it are left
 * for the other checks (Source warnings, Sources without repositories) to
 * suggest repositories for, so each fix only does one thing. Pure: doesn't
 * mutate `database`. */
export function applyBibliographyTitleSuggestion(
  database: GedcomDatabase,
  source: GedcomSource,
): GedcomDatabase {
  const bibliography = bibliographyForMissingTitle(source);
  if (bibliography === undefined) return database;

  return produce(database, (draft) => {
    const draftSource = draft.sources[source.xref];
    if (draftSource === undefined) return;
    draftSource.title = bibliography;
    draftSource.unknownRecords = draftSource.unknownRecords.filter(
      (record) => record.tag !== "_BIBL",
    );
  });
}
