export interface GedcomRecord {
  xref?: string;
  tag: string;
  abstag: string;
  value?: string;
  children: GedcomRecord[];
}

export function parseGedcomRecords(text: string): GedcomRecord[] {
  return generateGedcomRecords(text).toArray();
}

export function* generateGedcomRecords(text: string): Generator<GedcomRecord> {
  const lines = text.split(/\r?\n/);
  let ladder: GedcomRecord[] = [];

  for (const [lineNumber, line] of lines.entries()) {
    if (line == "") {
      continue;
    }
    const match = /^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.*)$/.exec(line);
    if (match == null) {
      throw new Error(`Failed to parse line number ${lineNumber + 1}: ${line}`);
    }
    const level = parseInt(match[1], 10);
    const [xref, tag, value] = match.slice(2);
    const abstag = [
      ...ladder.slice(0, level).map((record) => record.tag),
      tag,
    ].join(".");
    const record = {
      xref,
      tag,
      abstag,
      value: value || undefined,
      children: [],
    };

    if (level == 0) {
      if (ladder.length > 0) {
        yield ladder[0];
      }
      ladder = [record];
    } else if (level <= ladder.length) {
      const parent = ladder[level - 1];
      ladder.length = level;
      if (tag === "CONC") {
        parent.value ??= "";
        parent.value += value;
      } else if (tag === "CONT") {
        parent.value ??= "";
        parent.value += "\n";
        parent.value += value;
      } else {
        parent.children.push(record);
        ladder.push(record);
      }
    } else {
      throw new Error(
        `Skipped parent level on line number ${lineNumber + 1}: ${line}`,
      );
    }
  }
  if (ladder.length > 0) {
    yield ladder[0];
  }
}

export function serializeGedcomRecordToText(
  gedcomRecord: GedcomRecord,
  level = 0,
): string[] {
  const [firstValue, ...remainingValues] =
    gedcomRecord.value?.split("\n") ?? [];
  return [
    `${level}` +
      (gedcomRecord.xref ? ` ${gedcomRecord.xref}` : "") +
      ` ${gedcomRecord.tag}` +
      (firstValue ? ` ${firstValue}` : ""),
    ...remainingValues.map(
      (nextValue) => `${level + 1} CONT` + (nextValue ? ` ${nextValue}` : ""),
    ),
    ...gedcomRecord.children.flatMap((record) =>
      serializeGedcomRecordToText(record, level + 1),
    ),
  ];
}
