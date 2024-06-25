import {GedcomRecord, parseGedcomRecordsFromText} from './gedcomRecord';

it('validate merging of conc and cont', () => {
  const gedcomText =
    '0 @I1@ INDI\n' +
    '1 NAME john \n' +
    '2 CONC doe\n' +
    '2 CONT senior\n';
  const gedcomRecords = Array.from(parseGedcomRecordsFromText(gedcomText));
  expect(gedcomRecords).toStrictEqual([
    new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
      new GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe\nsenior', []),
    ]),
  ]);
  expect(gedcomRecords.flatMap((record) => record.text())).toStrictEqual([
    '0 @I1@ INDI',
    '1 NAME john doe',
    '2 CONT senior',
  ]);
});
