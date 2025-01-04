import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomEvent {
  type: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  value?: string;
  citations: GedcomCitation[];
  sharedWithXrefs: string[];

  gedcomRecord?: GedcomRecord;
}
