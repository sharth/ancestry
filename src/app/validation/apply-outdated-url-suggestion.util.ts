import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

/** A site that moved its pages: a call number matching `pattern` (the whole
 * call number) is rewritten to what `replacement` returns for the match.
 * It also gets the call number's source, for a site whose new URL depends
 * on what kind of record the source is, and returns undefined when it
 * can't tell the new URL. */
interface UrlRewrite {
  site: string;
  pattern: RegExp;
  replacement: (
    match: RegExpExecArray,
    source: GedcomSource,
  ) => string | undefined;
}

// IrishGenealogy.ie's new record ids start with the kind of civil record,
// which is told from the words in the source's title and abbreviation.
const irishGenealogyRecordTypes = [
  { recordType: "cibi", words: /\bbirths?\b/i },
  { recordType: "cima", words: /\bmarriages?\b/i },
  { recordType: "cide", words: /\bdeaths?\b/i },
];

export const urlRewrites: readonly UrlRewrite[] = [
  {
    // Old civil record ids are six hex characters followed by the record
    // number, e.g. 9cbd43 + 4898349, and don't say whether the record is a
    // birth, marriage or death, so that comes from the source's title.
    site: "IrishGenealogy.ie",
    pattern:
      /^https?:\/\/civilrecords\.irishgenealogy\.ie\/churchrecords\/details-civil\/[0-9a-f]{6}(\d+)\/?$/i,
    replacement: ([, recordNumber], source) => {
      const text = `${source.title}\n${source.abbr}`;
      const recordTypes = irishGenealogyRecordTypes.filter(({ words }) =>
        words.test(text),
      );
      if (recordTypes.length !== 1) return undefined;
      return `https://www.irishgenealogy.ie/view/?record_id=${recordTypes[0]?.recordType}-${recordNumber}`;
    },
  },
  {
    // A record is <record id>:<collection id>.
    site: "Ancestry",
    pattern:
      /^https?:\/\/(?:www\.)?ancestry\.com\/discoveryui-content\/view\/(\d+):(\d+)\/?$/i,
    replacement: ([, record, collection]) =>
      `https://www.ancestry.com/search/collections/${collection}/records/${record}`,
  },
];

export interface OutdatedUrl {
  site: string;
  oldUrl: string;
  /** Undefined when the rewrite can't tell what the new URL is. */
  newUrl: string | undefined;
}

/** The outdated URL a call number of `source` is, with the URL it moves
 * to, or undefined when no rewrite matches it. */
export function outdatedUrl(
  callNumber: string,
  source: GedcomSource,
): OutdatedUrl | undefined {
  const oldUrl = callNumber.trim();
  for (const { site, pattern, replacement } of urlRewrites) {
    const match = pattern.exec(oldUrl);
    if (match !== null) {
      return { site, oldUrl, newUrl: replacement(match, source) };
    }
  }
  return undefined;
}

/** Each of a source's call numbers that is an outdated URL. */
export function outdatedUrlsToUpdate(source: GedcomSource): OutdatedUrl[] {
  return source.repositoryLinks.flatMap((repositoryLink) =>
    repositoryLink.callNumbers.flatMap(
      (callNumber) => outdatedUrl(callNumber, source) ?? [],
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
          (callNumber) => outdatedUrl(callNumber, source)?.newUrl ?? callNumber,
        );
      }
    }
  });
}
