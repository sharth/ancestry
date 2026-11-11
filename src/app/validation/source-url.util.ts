import type { Immutable } from "immer";

import type { GedcomRepository } from "../../gedcom/gedcomRepository";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

export interface ExtractedUrl {
  url: string;
  /** Whether `url` occupies its own line (after trimming whitespace) --
   * `false` when it's embedded alongside other text on the same line, e.g.
   * as part of a citation or footnote. A standalone URL can be safely
   * stripped out of the field when a fix is applied; an embedded one is
   * left in place since removing just the URL would mangle the surrounding
   * sentence. */
  standalone: boolean;
}

/** Every http(s) URL found in `text`, in order, or an empty array if there
 * isn't one. */
export function extractUrls(text: string): ExtractedUrl[] {
  const urls: ExtractedUrl[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    for (const match of line.matchAll(URL_PATTERN)) {
      // A trailing colon is almost always punctuation introducing what
      // follows (e.g. "https://example.com/foo: 1850 census"), not part of
      // the URL.
      const url = match[0].replace(/:+$/, "");
      urls.push({ url, standalone: url === line });
    }
  }
  return urls;
}

/** The domain of a URL, e.g. "familysearch.org" for
 * "https://www.familysearch.org/search/record" -- the part of the host used
 * to decide whether two URLs belong to the same site. Returns undefined if
 * `url` isn't a valid URL. Strips only a leading "www." label: two hosts
 * are the same site only when they match in full otherwise, so
 * "nationalarchives.uk" and "census.nationalarchives.ie" are correctly
 * treated as different sites even though both contain "nationalarchives". */
export function urlDomainLabel(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/** Normalizes familysearch.org URLs so "familysearch.org" and
 * "www.familysearch.org" are treated as the same site, preferring the www
 * form -- FamilySearch serves the bare and www hosts interchangeably, and a
 * source citing one shouldn't be flagged as missing a link already present
 * under the other. Deliberately limited to familysearch.org; other
 * bare/www host pairs aren't normalized. Returns `url` unchanged if it
 * isn't a valid URL or isn't a familysearch.org host. */
export function normalizeFamilySearchUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "familysearch.org") {
      parsed.hostname = "www.familysearch.org";
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** A repository doesn't have a dedicated URL field (GEDCOM's REPOSITORY_RECORD
 * doesn't define one -- see CLAUDE.md), so matching is necessarily loose:
 * this looks for an existing repository whose name contains (or is
 * contained by) the URL's domain label, e.g. a repository named
 * "FamilySearch" matches "https://www.familysearch.org/...". Returns
 * undefined when no repository's name overlaps with the domain at all. */
export function findMatchingRepository(
  url: string,
  repositories: Immutable<Record<string, Immutable<GedcomRepository>>>,
): Immutable<GedcomRepository> | undefined {
  const domainLabel = urlDomainLabel(url);
  if (domainLabel === undefined || domainLabel === "") return undefined;
  const normalizedDomainLabel = normalizeForMatch(domainLabel);

  return Object.values(repositories).find((repository) => {
    const normalizedName = normalizeForMatch(repository.name);
    return (
      normalizedName !== "" &&
      (normalizedName.includes(normalizedDomainLabel) ||
        normalizedDomainLabel.includes(normalizedName))
    );
  });
}
