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

it('conc onto the empty string', () => {
  const gedcomText =
  '0 TAG\n' +
  '1 CONC value\n';
  const gedcomRecords = Array.from(parseGedcomRecordsFromText(gedcomText));
  expect(gedcomRecords).toStrictEqual([
    new GedcomRecord(0, undefined, 'TAG', 'TAG', 'value', []),
  ]);
  expect(gedcomRecords.flatMap((record) => record.text())).toStrictEqual([
    '0 TAG value',
  ]);
});

it('cont onto the empty string', () => {
  const gedcomText =
  '0 TAG\n' +
  '1 CONT value\n';
  const gedcomRecords = Array.from(parseGedcomRecordsFromText(gedcomText));
  expect(gedcomRecords).toStrictEqual([
    new GedcomRecord(0, undefined, 'TAG', 'TAG', '\nvalue', []),
  ]);
  expect(gedcomRecords.flatMap((record) => record.text())).toStrictEqual([
    '0 TAG',
    '1 CONT value',
  ]);
});

it('empty lines presented correctly', () => {
  const gedcomText =
  '0 TAG\n' +
  '1 CONC\n' +
  '1 CONT\n' +
  '1 CONT\n';
  const gedcomRecords = Array.from(parseGedcomRecordsFromText(gedcomText));
  expect(gedcomRecords).toStrictEqual([
    new GedcomRecord(0, undefined, 'TAG', 'TAG', '\n\n', []),
  ]);
  expect(gedcomRecords.flatMap((record) => record.text())).toStrictEqual([
    '0 TAG',
    '1 CONT',
    '1 CONT',
  ]);
});
