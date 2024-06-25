export class GedcomRecord {
  constructor(
    public level: number,
    public xref: string | undefined,
    public tag: string,
    public abstag: string,
    public value: string | undefined,
    public children: GedcomRecord[] = []) { }

  text(): string[] {
    const gedcom: string[] = [];
    const [firstValue, ...remainingValues] = this.value?.split('\n') ?? [];
    gedcom.push([this.level, this.xref, this.tag, firstValue].filter((s) => s != null).join(' '));
    gedcom.push(...remainingValues.map((v) => `${this.level + 1} CONT ${v}`));
    gedcom.push(...this.children.flatMap((childRecord) => childRecord.text()));
    return gedcom;
  }
};

export function* parseGedcomRecordsFromText(text: string): Generator<GedcomRecord> {
  const lines = text.split(/\r?\n/);
  let ladder: GedcomRecord[] = [];

  for (const line of lines) {
    if (line == '') {
      continue;
    }
    const match = line.match(/^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/);
    if (match == null) {
      throw new Error();
    }
    const level = parseInt(match[1], 10);
    const [xref, tag, value] = match.slice(2);
    const abstag = [...ladder.slice(0, level).map((record) => record.tag), tag].join('.');
    const record = new GedcomRecord(level, xref, tag, abstag, value);

    if (record.level === 0) {
      if (ladder.length > 0) {
        yield ladder[0];
      }
      ladder = [record];
    } else if (record.tag === 'CONC') {
      ladder.at(-1)!.value! += record.value;
    } else if (record.tag === 'CONT') {
      ladder.at(-1)!.value! += '\n' + (record.value ?? '');
    } else {
      ladder.length = record.level;
      ladder.at(-1)!.children.push(record);
      ladder.push(record);
    }
  }
  if (ladder.length > 0) {
    yield ladder[0];
  }
}
