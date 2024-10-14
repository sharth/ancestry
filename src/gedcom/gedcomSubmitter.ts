import type { GedcomRecord } from "./gedcomRecord";

export class GedcomSubmitter {
  constructor(public readonly xref: string) {}
  name?: string;
  email?: string;
}
