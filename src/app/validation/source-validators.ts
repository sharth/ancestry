import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import {
  extractUrls,
  findMatchingRepository,
  normalizeFamilySearchUrl,
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

/** A suggested fix for a source with more than one repository citation
 * pointing at the same repository: merge them into a single citation
 * carrying all of their call numbers. */
export interface MergeRepositoryLinksSuggestion {
  repositoryXref: string;
}

export interface ValidationFinding {
  fieldName: string;
  groupName: string;
  message: string;
  urlSuggestion?: UrlRepositorySuggestion;
  mergeRepositoryLinksSuggestion?: MergeRepositoryLinksSuggestion;
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
      // Already linked -- nothing to suggest. Compared via
      // normalizeFamilySearchUrl so a FamilySearch URL counts as already
      // linked whether the existing call number uses the bare or www host.
      if (
        source.repositoryLinks.some((link) =>
          link.callNumbers.some(
            (callNumber) =>
              normalizeFamilySearchUrl(callNumber) ===
              normalizeFamilySearchUrl(url),
          ),
        )
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

  const linksByRepository = new Map<string, number>();
  for (const link of source.repositoryLinks) {
    linksByRepository.set(
      link.repositoryXref,
      (linksByRepository.get(link.repositoryXref) ?? 0) + 1,
    );
  }
  for (const [repositoryXref, linkCount] of linksByRepository) {
    if (linkCount < 2) continue;
    const repository = database.repositories[repositoryXref];
    const repositoryLabel = repository?.name || repositoryXref;
    warnings.push({
      fieldName: "repositoryLinks",
      groupName: "Repository",
      message: `Has ${linkCount} separate repository citations for the "${repositoryLabel}" repository; these could be merged into one citation with all the call numbers.`,
      mergeRepositoryLinksSuggestion: { repositoryXref },
    });
  }

  return { errors: [], warnings };
}
