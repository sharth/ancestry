import * as gedcom from './';

describe('GedcomRecord Parsing', () => {
  test('conc is merged into the previous record', () => {
    const gedcomText = [
      '0 @I1@ INDI',
      '1 NAME john ',
      '2 CONC doe',
      '2 CONT senior'
    ];
    const gedcomRecords = gedcom.parseGedcomRecordsFromText(gedcomText.join('\n'));
    expect(gedcomRecords).toStrictEqual([
      new gedcom.GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
        new gedcom.GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe\nsenior', []),
      ]),
    ]);
  });

  test('conc onto the empty string', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONC value',
    ];
    const gedcomRecords = gedcom.parseGedcomRecordsFromText(gedcomText.join('\n'));
    expect(gedcomRecords).toStrictEqual([
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', 'value', []),
    ]);
  });

  test('cont onto the empty string', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONT value',
    ];
    const gedcomRecords = gedcom.parseGedcomRecordsFromText(gedcomText.join('\n'));
    expect(gedcomRecords).toStrictEqual([
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', '\nvalue', []),
    ]);
  });

  test('empty lines presented correctly', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONC',
      '1 CONT',
      '1 CONT',
    ];
    const gedcomRecords = gedcom.parseGedcomRecordsFromText(gedcomText.join('\n'));
    expect(gedcomRecords).toStrictEqual([
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', '\n\n', []),
    ]);
  });

  test('conc records disappear', () => {
    const gedcomText = [
      '0 TAG abc',
      '1 CONC def',
    ];
    const gedcomRecords = gedcom.parseGedcomRecordsFromText(gedcomText.join('\n'));
    expect(gedcomRecords).toStrictEqual([
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', 'abcdef', []),
    ]);
  });
});

describe('GedcomRecord Serializing', () => {
  test('serialize individual', () => {
    const gedcomRecord = new gedcom.GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
      new gedcom.GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe \n senior', [])
    ]);
    expect(gedcom.serializeGedcomRecordToText(gedcomRecord)).toStrictEqual([
      '0 @I1@ INDI',
      '1 NAME john doe ',
      '2 CONT  senior',
    ]); 
  });
});