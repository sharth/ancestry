import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { extractUrl, findMatchingRepository } from "./source-url.util";

/** A suggested fix for a validation finding: replace a URL embedded in a
 * source's free text with a link to a repository, reusing `matchedRepository`
 * when an existing repository's URL already matches, otherwise creating a
 * new one. */
export interface UrlRepositorySuggestion {
  url: string;
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

export function sourceValidators(
  source: GedcomSource,
  database: GedcomDatabase,
): SourceValidationResult {
  const warnings: ValidationFinding[] = [];

  const url = extractUrl(source.text);
  if (url !== undefined) {
    const matchedRepository = findMatchingRepository(
      url,
      database.repositories,
    );
    warnings.push({
      fieldName: "text",
      groupName: "Repository",
      message:
        matchedRepository !== undefined
          ? `Text contains a URL (${url}) that matches the "${matchedRepository.name || matchedRepository.xref}" repository.`
          : `Text contains a URL (${url}) that could become a repository.`,
      urlSuggestion: { url, matchedRepository },
    });
  }

  return { errors: [], warnings };
}
