import type { GedcomEvent } from "./gedcomEvent";

export interface GedcomFamily {
  xref: string;
  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[];
  events: GedcomEvent[];
}
