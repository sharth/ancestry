import type { GedcomRepository } from "../../gedcom/gedcomRepository";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/i;

/** The first http(s) URL found in `text`, or undefined if there isn't one. */
export function extractUrl(text: string): string | undefined {
  return URL_PATTERN.exec(text)?.[0];
}

/** The registrable domain label of a URL, e.g. "familysearch" for
 * "https://www.familysearch.org/search/record" -- the part of the host most
 * likely to also appear in a repository's name. Returns undefined if `url`
 * isn't a valid URL. */
export function urlDomainLabel(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".").at(-2) ?? host.split(".")[0];
  } catch {
    return undefined;
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
  repositories: Record<string, GedcomRepository>,
): GedcomRepository | undefined {
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
