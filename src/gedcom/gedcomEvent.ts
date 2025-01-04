import type { GedcomCitation } from "./gedcomCitation";

export interface GedcomEvent {
  type: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  value?: string;
  citations: GedcomCitation[];
  sharedWithXrefs: string[];
}
