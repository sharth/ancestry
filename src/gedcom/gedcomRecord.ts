export interface GedcomRecord {
  xref: string;
  tag: string;
  abstag: string;
  value: string;
  children: GedcomRecord[];
}

export function parseGedcomRecords(text: string): GedcomRecord[] {
  const lines = text.split(/\r?\n/);
  const records: GedcomRecord[] = [];
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
    const [xref, tag, value] = match.slice(2) as [string, string, string];
    const abstag = [
      ...ladder.slice(0, level).map((record) => record.tag),
      tag,
    ].join(".");
    const record: GedcomRecord = { xref, tag, abstag, value, children: [] };

    if (level == 0) {
      ladder = [record];
      records.push(record);
    } else if (level <= ladder.length) {
      const parent: GedcomRecord = ladder[level - 1]!;
      if (record.tag == "CONC") {
        parent.value += record.value;
      } else if (record.tag == "CONT") {
        parent.value += "\n";
        parent.value += record.value;
      } else {
        parent.children.push(record);
        ladder.length = level;
        ladder.push(record);
      }
    } else {
      throw new Error(
        `Skipped parent level on line number ${lineNumber + 1}: ${line}`,
      );
    }
  }

  return records;
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
