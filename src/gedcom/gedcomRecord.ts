export class GedcomRecord {
  constructor(
    public xref: string | undefined,
    public tag: string,
    public abstag: string,
    public value: string | undefined,
    public children: GedcomRecord[]
  ) {}
}
