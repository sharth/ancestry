import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

/** A site that moved its pages: a call number matching `pattern` (the whole
 * call number) is rewritten to `replacement`, which can use `pattern`'s
 * groups as `$1`, `$2`, etc. */
interface UrlRewrite {
  site: string;
  pattern: RegExp;
  replacement: string;
}

export const urlRewrites: readonly UrlRewrite[] = [
  {
    // Old civil record ids are six hex characters followed by the record
    // number, e.g. 9cbd43 + 4898349.
    site: "IrishGenealogy.ie",
    pattern:
      /^https?:\/\/civilrecords\.irishgenealogy\.ie\/churchrecords\/details-civil\/[0-9a-f]{6}(\d+)\/?$/i,
    replacement: "https://www.irishgenealogy.ie/view/?record_id=cide-$1",
  },
  {
    // A record is <record id>:<collection id>.
    site: "Ancestry",
    pattern:
      /^https?:\/\/(?:www\.)?ancestry\.com\/discoveryui-content\/view\/(\d+):(\d+)\/?$/i,
    replacement: "https://www.ancestry.com/search/collections/$2/records/$1",
  },
];

export interface OutdatedUrl {
  site: string;
  oldUrl: string;
  newUrl: string;
}

/** The outdated URL a call number is, with the URL it moves to, or
 * undefined when no rewrite matches it. */
export function outdatedUrl(callNumber: string): OutdatedUrl | undefined {
  const oldUrl = callNumber.trim();
  for (const { site, pattern, replacement } of urlRewrites) {
    if (pattern.test(oldUrl)) {
      return { site, oldUrl, newUrl: oldUrl.replace(pattern, replacement) };
    }
  }
  return undefined;
}

/** Each of a source's call numbers that is an outdated URL. */
export function outdatedUrlsToUpdate(source: GedcomSource): OutdatedUrl[] {
  return source.repositoryLinks.flatMap((repositoryLink) =>
    repositoryLink.callNumbers.flatMap(
      (callNumber) => outdatedUrl(callNumber) ?? [],
    ),
  );
}

/** Replaces each given source's outdated URL call numbers with their new
 * URLs. Pure: returns a new database. */
export function applyOutdatedUrlSuggestion(
  database: GedcomDatabase,
  sourceXrefs: string[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const xref of sourceXrefs) {
      const source = draft.sources[xref];
      if (source === undefined) continue;
      for (const repositoryLink of source.repositoryLinks) {
        repositoryLink.callNumbers = repositoryLink.callNumbers.map(
          (callNumber) => outdatedUrl(callNumber)?.newUrl ?? callNumber,
        );
      }
    }
  });
}
