import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {AncestryService} from '../app/ancestry.service';
import {parseGedcomRecordsFromText} from './gedcomRecord';
import {GedcomSource} from './gedcomSource';

describe('GedcomSource', () => {
  let ancestryService: AncestryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();
    ancestryService = TestBed.inject(AncestryService);
  });

  it('empty source has reasonable gedcom', () => {
    const gedcomText = '0 @S1@ SOUR\n';
    const records = Array.from(parseGedcomRecordsFromText(gedcomText));
    expect(records).toHaveLength(1);
    const source = new GedcomSource(records[0], ancestryService);
    expect(source.bibl).toBe(undefined);
    expect(source.fullTitle).toBe(undefined);
    expect(source.repositories).toHaveLength(0);
    expect(source.shortTitle).toBe(undefined);
    expect(source.text).toBe(undefined);
    expect(source.xref).toStrictEqual('@S1@');
    expect(source.gedcomRecord().text()).toStrictEqual([
      '0 @S1@ SOUR',
    ]);
  });
});
