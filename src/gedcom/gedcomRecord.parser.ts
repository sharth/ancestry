import {GedcomRecord} from './gedcomRecord';

export function* parseGedcomRecordsFromText(text: string): Generator<GedcomRecord> {
  const lines = text.split(/\r?\n/);
  let ladder: GedcomRecord[] = [];

  for (const line of lines) {
    if (line == '') {
      continue;
    }
    const match = /^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/.exec(line);
    if (match == null) {
      throw new Error();
    }
    const level = parseInt(match[1], 10);
    const [xref, tag, value] = match.slice(2);
    const abstag = [...ladder.slice(0, level).map((record) => record.tag), tag].join('.');
    const record = new GedcomRecord(level, xref, tag, abstag, value, []);

    if (level == 0) {
      if (ladder.length > 0) {
        yield ladder[0];
      }
      ladder = [record];
    } else if (tag === 'CONC') {
        ladder.at(-1)!.value ??= '';
        ladder.at(-1)!.value += (value ?? '');
    } else if (tag === 'CONT') {
        ladder.at(-1)!.value ??= '';
        ladder.at(-1)!.value += '\n';
        ladder.at(-1)!.value += (value ?? '');
    } else {
      ladder.length = level;
        ladder.at(-1)!.children.push(record);
        ladder.push(record);
    }
  }
  if (ladder.length > 0) {
    yield ladder[0];
  }
}
