import type { GedcomRecord } from "./gedcomRecord";

export class GedcomSubmitter {
  constructor(
    public readonly xref: string,
    public readonly gedcomRecord: GedcomRecord,
  ) {}
  name?: string;
  email?: string;
}
