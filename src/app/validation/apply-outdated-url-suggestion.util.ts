import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

/** A site that moved its pages: a call number matching `pattern` (the whole
 * call number) is rewritten to what `replacement` returns for the match.
 * `citedFactTags` are the tags of the facts citing the call number's source
 * (BIRT, MARR, etc.), for a site whose new URL depends on the kind of
 * record. `replacement` returns undefined when it can't tell the new URL. */
interface UrlRewrite {
  site: string;
  pattern: RegExp;
  replacement: (
    match: RegExpExecArray,
    citedFactTags: ReadonlySet<string>,
  ) => string | undefined;
}

// IrishGenealogy.ie's new record ids start with the kind of civil record.
const irishGenealogyRecordTypes: Record<string, string> = {
  BIRT: "cibi",
  MARR: "cima",
  DEAT: "cide",
};

export const urlRewrites: readonly UrlRewrite[] = [
  {
    // Old civil record ids are six hex characters followed by the record
    // number, e.g. 9cbd43 + 4898349, and don't say whether the record is a
    // birth, marriage or death, so that comes from the facts citing it.
    site: "IrishGenealogy.ie",
    pattern:
      /^https?:\/\/civilrecords\.irishgenealogy\.ie\/churchrecords\/details-civil\/[0-9a-f]{6}(\d+)\/?$/i,
    replacement: ([, recordNumber], citedFactTags) => {
      const recordTypes = new Set(
        Array.from(citedFactTags).flatMap(
          (tag) => irishGenealogyRecordTypes[tag] ?? [],
        ),
      );
      if (recordTypes.size !== 1) return undefined;
      const [recordType] = recordTypes;
      return `https://www.irishgenealogy.ie/view/?record_id=${recordType}-${recordNumber}`;
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

/** The outdated URL a call number is, with the URL it moves to, or
 * undefined when no rewrite matches it. */
export function outdatedUrl(
  callNumber: string,
  citedFactTags: ReadonlySet<string> = new Set(),
): OutdatedUrl | undefined {
  const oldUrl = callNumber.trim();
  for (const { site, pattern, replacement } of urlRewrites) {
    const match = pattern.exec(oldUrl);
    if (match !== null) {
      return { site, oldUrl, newUrl: replacement(match, citedFactTags) };
    }
  }
  return undefined;
}

// The tags of the individual and family facts citing each source, by
// source xref. Cached per database, since every source's check needs it.
const citedFactTagsCache = new WeakMap<
  GedcomDatabase,
  Map<string, Set<string>>
>();

export function citedFactTags(
  database: GedcomDatabase,
  sourceXref: string,
): ReadonlySet<string> {
  let bySource = citedFactTagsCache.get(database);
  if (bySource === undefined) {
    bySource = new Map();
    for (const record of [
      ...Object.values(database.individuals),
      ...Object.values(database.families),
    ]) {
      for (const fact of record.facts) {
        for (const citation of fact.citations) {
          const tags = bySource.get(citation.sourceXref) ?? new Set<string>();
          bySource.set(citation.sourceXref, tags);
          tags.add(fact.tag);
        }
      }
    }
    citedFactTagsCache.set(database, bySource);
  }
  return bySource.get(sourceXref) ?? new Set();
}

/** Each of a source's call numbers that is an outdated URL. */
export function outdatedUrlsToUpdate(
  database: GedcomDatabase,
  source: GedcomSource,
): OutdatedUrl[] {
  const tags = citedFactTags(database, source.xref);
  return source.repositoryLinks.flatMap((repositoryLink) =>
    repositoryLink.callNumbers.flatMap(
      (callNumber) => outdatedUrl(callNumber, tags) ?? [],
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
      const tags = citedFactTags(database, xref);
      for (const repositoryLink of source.repositoryLinks) {
        repositoryLink.callNumbers = repositoryLink.callNumbers.map(
          (callNumber) => outdatedUrl(callNumber, tags)?.newUrl ?? callNumber,
        );
      }
    }
  });
}
