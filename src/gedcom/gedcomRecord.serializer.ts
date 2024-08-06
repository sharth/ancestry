import type {GedcomRecord} from './gedcomRecord';

export function serializeGedcomRecordToText(gedcomRecord: GedcomRecord): string {
  const [firstValue, ...remainingValues] = gedcomRecord.value?.split('\n') ?? [];
  return [
    `${gedcomRecord.level}` +
        (gedcomRecord.xref ? ` ${gedcomRecord.xref}` : '') +
        ` ${gedcomRecord.tag}` +
        (firstValue ? ` ${firstValue}` : ''),
    ...remainingValues.map(
        (nextValue) => `${gedcomRecord.level + 1} CONT` + (nextValue ? ` ${nextValue}` : '')),
    ...gedcomRecord.children.flatMap(serializeGedcomRecordToText),
  ].join('\n');
}
