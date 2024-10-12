import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomRecordToText(
  gedcomRecord: GedcomRecord,
  level = 0
): string[] {
  const [firstValue, ...remainingValues] =
    gedcomRecord.value?.split("\n") ?? [];
  return [
    `${level}` +
      (gedcomRecord.xref ? ` ${gedcomRecord.xref}` : "") +
      ` ${gedcomRecord.tag}` +
      (firstValue ? ` ${firstValue}` : ""),
    ...remainingValues.map(
      (nextValue) => `${level + 1} CONT` + (nextValue ? ` ${nextValue}` : "")
    ),
    ...gedcomRecord.children.flatMap((record) =>
      serializeGedcomRecordToText(record, level + 1)
    ),
  ];
}
