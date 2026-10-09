import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { MergeRepositoryLinksSuggestion } from "./source-validators";

/** Applies a suggested fix for a source with more than one repository
 * citation pointing at the same repository: merges them into the first
 * such citation, carrying over every distinct call number, and drops the
 * rest. Pure -- doesn't mutate `database`, so it's safe to use both for a
 * preview and as the database handed to the GEDCOM editor for further
 * review before saving. */
export function applyMergeRepositoryLinksSuggestion(
  database: GedcomDatabase,
  source: GedcomSource,
  suggestion: MergeRepositoryLinksSuggestion,
): GedcomDatabase {
  return produce(database, (draft) => {
    const draftSource = draft.sources[source.xref];
    if (draftSource === undefined) return;

    const mergedCallNumbers: string[] = [];
    for (const link of draftSource.repositoryLinks) {
      if (link.repositoryXref !== suggestion.repositoryXref) continue;
      for (const callNumber of link.callNumbers) {
        if (!mergedCallNumbers.includes(callNumber)) {
          mergedCallNumbers.push(callNumber);
        }
      }
    }

    let merged = false;
    draftSource.repositoryLinks = draftSource.repositoryLinks.filter((link) => {
      if (link.repositoryXref !== suggestion.repositoryXref) return true;
      if (merged) return false;
      link.callNumbers = mergedCallNumbers;
      merged = true;
      return true;
    });
  });
}
