import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import * as gedcom from './';

describe('GedcomIndividual Parser', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  test('Male', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
      '1 SEX M',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    expect(gedcomIndividual.xref).toEqual('@I1@');
    expect(gedcomIndividual.sex).toEqual('Male');
  });

  test('Female', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
      '1 SEX F',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    expect(gedcomIndividual.xref).toEqual('@I1@');
    expect(gedcomIndividual.sex).toEqual('Female');
  });

  it('Unspecified Sex', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    expect(gedcomIndividual.xref).toEqual('@I1@');
    expect(gedcomIndividual.sex).toEqual(undefined);
  });

  it('Family Search Id', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I4@ INDI',
      '1 _FSFTID abcd',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    expect(gedcomIndividual.xref).toEqual('@I4@');
    expect(gedcomIndividual.familySearchId).toEqual('abcd');
  });
});
