import type { GedcomRepository } from "../../gedcom/gedcomRepository";

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"')\]]+/i;

/** The first http(s) URL found in `text`, or undefined if there isn't one. */
export function extractUrl(text: string): string | undefined {
  return URL_PATTERN.exec(text)?.[0];
}

/** Normalizes a URL for loose matching: scheme, "www.", and any trailing
 * slash are stripped and the result is lowercased, so
 * "https://www.Example.com/" and "example.com" compare equal. Returns
 * undefined if `url` isn't a valid URL. */
export function normalizeUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return undefined;
  }
}

/** The existing repository whose `url` matches `url` most closely, if any:
 * an exact match (ignoring scheme/"www."/trailing slash) first, then a
 * same-host match. */
export function findMatchingRepository(
  url: string,
  repositories: Record<string, GedcomRepository>,
): GedcomRepository | undefined {
  const normalized = normalizeUrl(url);
  if (normalized === undefined) return undefined;

  const candidates = Object.values(repositories).filter(
    (repository) => repository.url !== "",
  );

  const exactMatch = candidates.find(
    (repository) => normalizeUrl(repository.url) === normalized,
  );
  if (exactMatch !== undefined) return exactMatch;

  const host = normalized.split("/")[0];
  return candidates.find(
    (repository) => normalizeUrl(repository.url)?.split("/")[0] === host,
  );
}
