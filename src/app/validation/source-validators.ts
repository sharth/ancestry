import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import {
  extractUrls,
  findMatchingRepository,
  urlDomainLabel,
} from "./source-url.util";

/** The source fields worth scanning for an embedded URL, in the order
 * checked. Abbr and Title are the common spots in real-world GEDCOM
 * exports (e.g. Ancestry.com); Text is checked too since some exports put
 * it there instead. */
const URL_SEARCH_FIELDS = ["abbr", "title", "text"] as const;

export type UrlSuggestionFieldName = (typeof URL_SEARCH_FIELDS)[number];

/** A suggested fix for a validation finding: link the source to a
 * repository for a URL found in one of its fields, reusing
 * `matchedRepository` when an existing repository's name looks like it's
 * for the same place, otherwise creating a new one named `suggestedName`.
 * The URL itself is only removed from `fieldName` when `standalone` is
 * true -- see `ExtractedUrl`. */
export interface UrlRepositorySuggestion {
  fieldName: UrlSuggestionFieldName;
  url: string;
  standalone: boolean;
  suggestedName: string;
  matchedRepository?: GedcomRepository;
}

export interface ValidationFinding {
  fieldName: string;
  groupName: string;
  message: string;
  urlSuggestion?: UrlRepositorySuggestion;
}

export interface SourceValidationResult {
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
}

const FIELD_LABELS: Record<UrlSuggestionFieldName, string> = {
  abbr: "Abbreviation",
  title: "Title",
  text: "Text",
};

export function sourceValidators(
  source: GedcomSource,
  database: GedcomDatabase,
): SourceValidationResult {
  const warnings: ValidationFinding[] = [];

  const candidates: {
    fieldName: UrlSuggestionFieldName;
    url: string;
    standalone: boolean;
  }[] = [];
  for (const fieldName of URL_SEARCH_FIELDS) {
    for (const { url, standalone } of extractUrls(source[fieldName])) {
      // Already linked -- nothing to suggest.
      if (
        source.repositoryLinks.some((link) => link.callNumbers.includes(url))
      ) {
        continue;
      }
      candidates.push({ fieldName, url, standalone });
    }
  }

  for (const candidate of candidates) {
    // Skip a URL that's just a shorter prefix of another, more complete URL
    // also found in this source -- almost certainly the same reference
    // mentioned twice (e.g. a bare domain inside a citation sentence,
    // alongside the full link elsewhere in the same field), so only the
    // more specific one is worth proposing.
    const isPrefixOfAnother = candidates.some(
      (other) =>
        other !== candidate &&
        other.url !== candidate.url &&
        other.url.startsWith(candidate.url),
    );
    if (isPrefixOfAnother) continue;

    const { fieldName, url, standalone } = candidate;
    const matchedRepository = findMatchingRepository(
      url,
      database.repositories,
    );
    const suggestedName = urlDomainLabel(url) ?? url;
    const fieldLabel = FIELD_LABELS[fieldName];
    warnings.push({
      fieldName,
      groupName: "Repository",
      message:
        matchedRepository !== undefined
          ? `${fieldLabel} contains a URL (${url}) that looks like it belongs to the "${matchedRepository.name || matchedRepository.xref}" repository.`
          : `${fieldLabel} contains a URL (${url}) that could become a repository.`,
      urlSuggestion: {
        fieldName,
        url,
        standalone,
        suggestedName,
        matchedRepository,
      },
    });
  }

  return { errors: [], warnings };
}
