import {GedcomRecord} from './gedcomRecord';

it('validate gedcom', () => {
  const gedcomRecord = new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
    new GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe\nsenior'),
  ]);

  expect(gedcomRecord.text()).toEqual([
    '0 @I1@ INDI',
    '1 NAME john doe',
    '2 CONT senior',
  ]);
});
