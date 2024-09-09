import {TestBed} from '@angular/core/testing';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import * as gedcom from '../gedcom';

describe('GedcomFamily', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  test('No Parents', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @F1@ FAM',
    ].join("\n"));
    const gedcomFamily = gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord);
    expect(gedcomFamily.xref).toEqual('@F1@')
    expect(gedcomFamily.husbandXref).toEqual(undefined);
    expect(gedcomFamily.wifeXref).toEqual(undefined);
  });

  test('Parents', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @F3@ FAM',
      '1 WIFE @I2@',
      '1 HUSB @I3@',
    ].join("\n"));
    const gedcomFamily = gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord);
    expect(gedcomFamily.xref).toEqual('@F3@')
    expect(gedcomFamily.husbandXref).toEqual("@I3@");
    expect(gedcomFamily.wifeXref).toEqual("@I2@");
  });
});
