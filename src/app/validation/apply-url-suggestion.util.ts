import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { calculateNextRepositoryXref } from "../../util/next-xref";
import type { UrlRepositorySuggestion } from "./source-validators";

export interface ApplyUrlSuggestionResult {
  database: GedcomDatabase;
  /** The repository the source was linked to: `suggestion.matchedRepository`'s
   * xref, or the newly created repository's xref. */
  repositoryXref: string;
}

/** Applies a suggested fix for a URL found in a source's text: links the
 * source to the matched repository (or a newly created one), carrying the
 * URL over as that link's call number, and removes the URL from the
 * source's text. Pure -- doesn't mutate `database`, so it's safe to use
 * both for a preview and as the database handed to the GEDCOM editor for
 * further review before saving. */
export function applyUrlSuggestion(
  database: GedcomDatabase,
  source: GedcomSource,
  suggestion: UrlRepositorySuggestion,
): ApplyUrlSuggestionResult {
  const repositoryXref =
    suggestion.matchedRepository?.xref ?? calculateNextRepositoryXref(database);

  const updatedDatabase = produce(database, (draft) => {
    draft.repositories[repositoryXref] ??= newGedcomRepository({
      xref: repositoryXref,
      name: suggestion.suggestedName,
    });

    const draftSource = draft.sources[source.xref];
    if (draftSource === undefined) return;
    const existingLink = draftSource.repositoryLinks.find(
      (link) => link.repositoryXref === repositoryXref,
    );
    if (existingLink === undefined) {
      draftSource.repositoryLinks.push(
        newGedcomRepositoryLink({
          repositoryXref,
          callNumber: suggestion.url,
        }),
      );
    } else {
      existingLink.callNumber ||= suggestion.url;
    }
    draftSource.text = draftSource.text.replace(suggestion.url, "").trim();
  });

  return { database: updatedDatabase, repositoryXref };
}
