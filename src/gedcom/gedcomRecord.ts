export interface GedcomRecord {
  xref: string;
  tag: string;
  abstag: string;
  value: string;
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
    const match = /^([0-9]+) *((?:@[^@]+@)?) *([A-Z0-9_]+) *(.*)$/.exec(line);
    if (match == null) {
      throw new Error(`Failed to parse line number ${lineNumber + 1}: ${line}`);
    }
    const level = parseInt(match[1]!, 10);
    const [xref, tag, value] = match.slice(2);
    const abstag = [
      ...ladder.slice(0, level).map((record) => record.tag),
      tag,
    ].join(".");
    const record: GedcomRecord = {
      xref: xref!,
      tag: tag!,
      abstag,
      value: value!,
      children: [],
    };

    if (level == 0) {
      if (ladder.length > 0) {
        yield ladder[0]!;
      }
      ladder = [record];
    } else if (level <= ladder.length) {
      const parent: GedcomRecord = ladder[level - 1]!;
      parent.children.push(record);
      ladder.length = level;
      ladder.push(record);
    } else {
      throw new Error(
        `Skipped parent level on line number ${lineNumber + 1}: ${line}`,
      );
    }
  }
  if (ladder.length > 0) {
    yield ladder[0]!;
  }
}

export function mergeConcContRecords(gedcomRecord: GedcomRecord): GedcomRecord {
  const newRecord: GedcomRecord = { ...gedcomRecord, children: [] };
  for (const childRecord of gedcomRecord.children) {
    if (childRecord.tag == "CONC") {
      newRecord.value += childRecord.value;
    } else if (childRecord.tag == "CONT") {
      newRecord.value += "\n";
      newRecord.value += childRecord.value;
    } else {
      newRecord.children.push(mergeConcContRecords(childRecord));
    }
  }
  return newRecord;
}

export function serializeGedcomRecordToText(
  gedcomRecord: GedcomRecord,
  level = 0,
): string[] {
  const [firstValue, ...remainingValues] = gedcomRecord.value.split("\n");
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

// Reorder the first arugment (gedcomRecords) to be sorted in the order
// given by the second argument (canonicallyOrderedRecords). New records
// will be found at the end, except that TRLR will always be the last
// record if it is included in gedcomRecords.
export function sortRecordsByOtherRecords(
  gedcomRecords: GedcomRecord[],
  canonicallyOrderedRecords: GedcomRecord[],
): GedcomRecord[] {
  const orderedRecords = new Map<string, GedcomRecord | undefined>();
  for (const record of canonicallyOrderedRecords) {
    const key = `${record.tag} ${record.xref} ${record.value}`;
    if (record.tag == "TRLR") {
      continue;
    }
    if (orderedRecords.get(key)) {
      throw new Error(`key ${key} already used`);
    }
    orderedRecords.set(key, undefined);
  }
  for (const record of gedcomRecords) {
    const key = `${record.tag} ${record.xref} ${record.value}`;
    if (orderedRecords.get(key)) {
      throw new Error(`key ${key} already used`);
    }
    orderedRecords.set(key, record);
  }

  return orderedRecords
    .values()
    .filter((record) => record != undefined)
    .toArray();
}
