import type { GedcomExternalIdentifier } from "../gedcom/gedcomExternalIdentifier";

/** The registered EXID type for FamilySearch Family Tree person ids. */
export const familySearchPersonIdType =
  "https://gedcom.io/exid-type/FamilySearch-PersonId";

// Ancestry has no registered EXID type. Its person ids only open within a
// tree, so the tree id is part of the TYPE, which is the person page URL
// without the person id, as the spec recommends.
const ancestryPersonIdTypePattern =
  /^https:\/\/www\.ancestry\.com\/family-tree\/person\/tree\/(\d+)\/person\/$/;

/** The TYPE for Ancestry person ids in the given Ancestry tree. */
export function ancestryPersonIdType(treeId: string): string {
  return `https://www.ancestry.com/family-tree/person/tree/${treeId}/person/`;
}

export interface ExternalIdentifierLink {
  label: string;
  url: string;
}

/** A web link for an EXID, or undefined when its authority isn't known. */
export function externalIdentifierLink(
  externalIdentifier: GedcomExternalIdentifier,
): ExternalIdentifierLink | undefined {
  const id = encodeURIComponent(externalIdentifier.id);
  if (id === "") return undefined;

  if (externalIdentifier.type === familySearchPersonIdType) {
    return {
      label: "FamilySearch",
      url: `https://www.familysearch.org/tree/person/details/${id}`,
    };
  }

  if (ancestryPersonIdTypePattern.test(externalIdentifier.type)) {
    return {
      label: "Ancestry",
      url: `${externalIdentifier.type}${id}/facts`,
    };
  }

  return undefined;
}
