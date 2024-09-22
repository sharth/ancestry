import { parseGedcomRecordsFromText } from '../util/gedcom-parser';
import { serializeGedcomRecordToText } from '../util/gedcom-serializer';
import * as gedcom from './';
import {assert} from "chai";

describe('GedcomRecord Parsing', () => {
  it('conc is merged into the previous record', () => {
    const gedcomText = [
      '0 @I1@ INDI',
      '1 NAME john ',
      '2 CONC doe',
      '2 CONT senior'
    ];
    const [gedcomRecord] = parseGedcomRecordsFromText(gedcomText.join('\n'));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
        new gedcom.GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe\nsenior', []),
      ]));
  });

  it('conc onto the empty string', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONC value',
    ];
    const [gedcomRecord] = parseGedcomRecordsFromText(gedcomText.join('\n'));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', 'value', []));
  });

  it('cont onto the empty string', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONT value',
    ];
    const [gedcomRecord] = parseGedcomRecordsFromText(gedcomText.join('\n'));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', '\nvalue', []));
  });

  it('empty lines presented correctly', () => {
    const gedcomText = [
      '0 TAG',
      '1 CONC',
      '1 CONT',
      '1 CONT',
    ];
    const gedcomRecords = parseGedcomRecordsFromText(gedcomText.join('\n'));
    assert.deepEqual(gedcomRecords, [
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', '\n\n', []),
    ]);
  });

  it('conc records disappear', () => {
    const gedcomText = [
      '0 TAG abc',
      '1 CONC def',
    ];
    const [gedcomRecord] = parseGedcomRecordsFromText(gedcomText.join('\n'));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(0, undefined, 'TAG', 'TAG', 'abcdef', []));
  });
});

describe('GedcomRecord Serializing', () => {
  it('serialize individual', () => {
    const gedcomRecord = new gedcom.GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
      new gedcom.GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe \n senior', [])
    ]);
    assert.deepEqual(serializeGedcomRecordToText(gedcomRecord), [
      '0 @I1@ INDI',
      '1 NAME john doe ',
      '2 CONT  senior',
    ]); 
  });
});