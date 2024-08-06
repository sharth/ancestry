export class GedcomRecord {
  constructor(
    public level: number,
    public xref: string | undefined,
    public tag: string,
    public abstag: string,
    public value: string | undefined,
    public children: GedcomRecord[]) { }
};
