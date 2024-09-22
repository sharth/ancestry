import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import * as gedcom from './';
import {assert} from 'chai';

describe('GedcomIndividual Parser', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  it('Male', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
      '1 SEX M',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    assert.equal(gedcomIndividual.xref, '@I1@');
    assert.equal(gedcomIndividual.sex, 'Male');
  });

  it('Female', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
      '1 SEX F',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    assert.equal(gedcomIndividual.xref, '@I1@');
    assert.equal(gedcomIndividual.sex, 'Female');
  });

  it('Unspecified Sex', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I1@ INDI',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    assert.equal(gedcomIndividual.xref, '@I1@');
    assert.equal(gedcomIndividual.sex, undefined);
  });

  it('Family Search Id', () => {
    const [gedcomRecord] = gedcom.parseGedcomRecordsFromText([
      '0 @I4@ INDI',
      '1 _FSFTID abcd',
    ].join('\n'));
    const gedcomIndividual = gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord);
    assert.equal(gedcomIndividual.xref, '@I4@');
    assert.equal(gedcomIndividual.familySearchId, 'abcd');
  });
});
