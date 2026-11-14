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

const familySearchPersonIdPattern = /^[A-Z0-9]{4}-[A-Z0-9]{2,4}$/;

/** The EXID for a pasted FamilySearch or Ancestry person page URL, or
 * undefined when the URL isn't one. Accepts e.g.
 * https://www.familysearch.org/en/tree/person/details/GQ8J-538,
 * https://www.familysearch.org/ark:/61903/4:1:GQ8J-538, and
 * https://www.ancestry.com/family-tree/person/tree/183714515/person/132395462563/facts
 * (any Ancestry country site). */
export function externalIdentifierFromUrl(
  text: string,
): GedcomExternalIdentifier | undefined {
  const url = URL.parse(text.trim());
  if (url === null) return undefined;
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  const segments = url.pathname.split("/").filter((segment) => segment !== "");

  if (/^(www\.)?familysearch\.org$/.test(url.hostname)) {
    const ark = /^4:1:([A-Z0-9-]+)$/.exec(segments.at(-1) ?? "");
    const id = ark?.[1] ?? (segments.includes("person") ? segments.at(-1) : "");
    if (id === undefined || !familySearchPersonIdPattern.test(id)) {
      return undefined;
    }
    return { id, type: familySearchPersonIdType };
  }

  if (
    /^(www\.)?ancestry\.(com|ca|de|fr|it|se|mx|co\.uk|com\.au)$/.test(
      url.hostname,
    )
  ) {
    const match =
      /\/family-tree\/person\/tree\/(\d+)\/person\/(\d+)(\/|$)/.exec(
        url.pathname,
      );
    if (match?.[1] === undefined || match[2] === undefined) return undefined;
    return { id: match[2], type: ancestryPersonIdType(match[1]) };
  }

  return undefined;
}
