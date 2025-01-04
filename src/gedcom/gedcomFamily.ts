import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomFamily {
  xref: string;
  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[];
  events: GedcomEvent[];

  gedcomRecord?: GedcomRecord;
}
