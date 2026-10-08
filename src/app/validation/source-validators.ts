import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import {
  extractUrl,
  findMatchingRepository,
  urlDomainLabel,
} from "./source-url.util";

/** The source fields worth scanning for an embedded URL, in the order
 * checked. Abbr and Title are the common spots in real-world GEDCOM
 * exports (e.g. Ancestry.com); Text is checked too since some exports put
 * it there instead. */
const URL_SEARCH_FIELDS = ["abbr", "title", "text"] as const;

export type UrlSuggestionFieldName = (typeof URL_SEARCH_FIELDS)[number];

/** A suggested fix for a validation finding: replace a URL embedded in one
 * of a source's fields with a link to a repository, reusing
 * `matchedRepository` when an existing repository's name looks like it's
 * for the same place, otherwise creating a new one named `suggestedName`. */
export interface UrlRepositorySuggestion {
  fieldName: UrlSuggestionFieldName;
  url: string;
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

  for (const fieldName of URL_SEARCH_FIELDS) {
    const url = extractUrl(source[fieldName]);
    if (url === undefined) continue;

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
      urlSuggestion: { fieldName, url, suggestedName, matchedRepository },
    });
  }

  return { errors: [], warnings };
}
