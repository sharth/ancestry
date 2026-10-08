import type { GedcomRepository } from "../../gedcom/gedcomRepository";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

/** Every http(s) URL found in `text`, in order, or an empty array if there
 * isn't one. */
export function extractUrls(text: string): string[] {
  return [...text.matchAll(URL_PATTERN)].map((match) => match[0]);
}

/** The registrable domain label of a URL, e.g. "familysearch" for
 * "https://www.familysearch.org/search/record" -- the part of the host most
 * likely to also appear in a repository's name. Returns undefined if `url`
 * isn't a valid URL. Picks the longest dot-separated label rather than
 * always the second-to-last one: a host with more than two labels after
 * "www" (e.g. government sites like "digitalarchives.state.pa.us") puts its
 * distinctive name first, not second-to-last -- the second-to-last label
 * there is "pa", which is both meaningless on its own and liable to match
 * an unrelated repository by pure substring luck (e.g. "newspapers.com"). */
export function urlDomainLabel(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const labels = host.split(".");
    return labels.reduce((longest, label) =>
      label.length > longest.length ? label : longest,
    );
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
