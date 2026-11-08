import { produce } from "immer";

import { generateGedcomChangeDate } from "../../gedcom/gedcomChangeDate";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import { sourceValidators } from "./source-validators";

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

export interface ApplyBibliographyTitleSuggestionResult {
  database: GedcomDatabase;
  /** The xrefs of the repositories created by the URL suggestions. */
  createdRepositoryXrefs: string[];
}

/** Moves an untitled source's `_BIBL` into its TITL and then, in the same
 * edit, applies every repository suggestion for URLs in the source as it
 * stands after the move -- so a URL that came over with the bibliography
 * becomes a repository call number too. Stamps the source's CHAN with
 * `now`, since its title changes. Pure, like applyUrlSuggestions. */
export function applyBibliographyTitleSuggestion(
  database: GedcomDatabase,
  source: GedcomSource,
  now = new Date(),
): ApplyBibliographyTitleSuggestionResult {
  const bibliography = bibliographyForMissingTitle(source);
  if (bibliography === undefined) {
    return { database, createdRepositoryXrefs: [] };
  }

  const moved = produce(database, (draft) => {
    const draftSource = draft.sources[source.xref];
    if (draftSource === undefined) return;
    draftSource.title = bibliography;
    draftSource.unknownRecords = draftSource.unknownRecords.filter(
      (record) => record.tag !== "_BIBL",
    );
    draftSource.changeDate = generateGedcomChangeDate(now);
  });

  const movedSource = moved.sources[source.xref];
  if (movedSource === undefined) {
    return { database: moved, createdRepositoryXrefs: [] };
  }
  const urlSuggestions = sourceValidators(movedSource, moved).warnings.flatMap(
    (warning) => warning.urlSuggestion ?? [],
  );
  return applyUrlSuggestions(moved, movedSource, urlSuggestions);
}
