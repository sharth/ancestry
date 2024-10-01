import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export class GedcomFamily {
  constructor(public xref: string) {}

  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[] = [];
  events: GedcomEvent[] = [];

  gedcomRecord?: GedcomRecord;
}
