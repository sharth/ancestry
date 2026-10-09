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

/** Applies a suggested fix for a URL found in one of a source's fields:
 * links the source to the matched repository (or a newly created one),
 * carrying the URL over as that link's call number, and removes the URL
 * from whichever field it was found in. Pure -- doesn't mutate `database`,
 * so it's safe to use both for a preview and as the database handed to the
 * GEDCOM editor for further review before saving. */
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
    // Reuse an existing link to the same repository -- a repository citation
    // can carry any number of call numbers, so a second URL to a repository
    // the source already links to is added as another call number on that
    // same link rather than as a second link.
    const existingLink = draftSource.repositoryLinks.find(
      (link) => link.repositoryXref === repositoryXref,
    );
    if (existingLink === undefined) {
      draftSource.repositoryLinks.push(
        newGedcomRepositoryLink({
          repositoryXref,
          callNumbers: [suggestion.url],
        }),
      );
    } else if (!existingLink.callNumbers.includes(suggestion.url)) {
      existingLink.callNumbers.push(suggestion.url);
    }
    // Only strip the URL out of the field when it occupied a line by
    // itself -- removing it from the middle of a larger block of text
    // would mangle the surrounding sentence, so an embedded URL is left in
    // place even after the repository link is added.
    if (suggestion.standalone) {
      draftSource[suggestion.fieldName] = draftSource[suggestion.fieldName]
        .split("\n")
        .filter((line) => line.trim() !== suggestion.url)
        .join("\n")
        .trim();
    }
  });

  return { database: updatedDatabase, repositoryXref };
}
