import {TestBed} from '@angular/core/testing';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import * as gedcom from '../gedcom';
import {assert} from 'chai';

describe('GedcomFamily', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  it('No Parents', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @F1@ FAM',
    ].join("\n"));
    const gedcomFamily = gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord);
    assert.equal(gedcomFamily, {
      xref: '@F1@',
      childXrefs: [],
      events: [],
    });
  });
  
  it('Parents', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @F3@ FAM',
      '1 WIFE @I2@',
      '1 HUSB @I3@',
    ].join("\n"));
    const gedcomFamily = gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord);
    gedcomFamily.gedcomRecord = undefined;
    expect(gedcomFamily).toEqual({
      xref: '@F1@',
      wifeXref: '@I2@',
      husbandXref: '@I3@',
      childXrefs: [],
      events: [],
    });
  });
});
