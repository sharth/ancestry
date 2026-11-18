import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

// IrishGenealogy.ie's old civil record pages were
// civilrecords.irishgenealogy.ie/churchrecords/details-civil/<id>, where the
// id is six hex characters followed by the record number, e.g. 9cbd43 +
// 4898349. The record now lives at www.irishgenealogy.ie/view/ with
// record_id "cide-" plus that record number.
const oldCivilRecordPattern =
  /^https?:\/\/civilrecords\.irishgenealogy\.ie\/churchrecords\/details-civil\/[0-9a-f]{6}(\d+)\/?$/i;

/** The new IrishGenealogy.ie URL for a call number that is an old civil
 * record URL, or undefined when it isn't one. */
export function newIrishGenealogyUrl(callNumber: string): string | undefined {
  const recordNumber = oldCivilRecordPattern.exec(callNumber.trim())?.[1];
  if (recordNumber === undefined) return undefined;
  return `https://www.irishgenealogy.ie/view/?record_id=cide-${recordNumber}`;
}

/** Each of a source's call numbers that is an old IrishGenealogy.ie civil
 * record URL, with the URL it moves to. */
export function irishGenealogyUrlsToUpdate(
  source: GedcomSource,
): { oldUrl: string; newUrl: string }[] {
  return source.repositoryLinks.flatMap((repositoryLink) =>
    repositoryLink.callNumbers.flatMap((oldUrl) => {
      const newUrl = newIrishGenealogyUrl(oldUrl);
      return newUrl === undefined ? [] : [{ oldUrl, newUrl }];
    }),
  );
}

/** Replaces each given source's old IrishGenealogy.ie civil record call
 * numbers with their new URLs. Pure: returns a new database. */
export function applyIrishGenealogyUrlSuggestion(
  database: GedcomDatabase,
  sourceXrefs: string[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const xref of sourceXrefs) {
      const source = draft.sources[xref];
      if (source === undefined) continue;
      for (const repositoryLink of source.repositoryLinks) {
        repositoryLink.callNumbers = repositoryLink.callNumbers.map(
          (callNumber) => newIrishGenealogyUrl(callNumber) ?? callNumber,
        );
      }
    }
  });
}
