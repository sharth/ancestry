export class GedcomRecord {
  constructor (
    public level: number,
    public xref: string | undefined,
    public tag: string,
    public abstag: string,
    public value: string | undefined) {}

  children = new Array<GedcomRecord>()

  gedcom (): string[] {
    const gedcom = new Array<string>()
    const values = this.value?.split('\n') ?? [undefined]
    gedcom.push([this.level, this.xref, this.tag, values[0]].filter(s => s != null).join(' '))
    gedcom.push(...values.slice(1).map(v => `${this.level + 1} CONT ${v}`))
    gedcom.push(...this.children.map(childRecord => childRecord.gedcom()).flat())
    return gedcom
  }
};
