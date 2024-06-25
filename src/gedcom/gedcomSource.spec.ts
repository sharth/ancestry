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

  test('empty source has reasonable gedcom', () => {
    const gedcomText = '0 @S1@ SOUR\n';
    const records = Array.from(parseGedcomRecordsFromText(gedcomText));
    expect(records).toHaveLength(1);
    const source = new GedcomSource(records[0], ancestryService);
    expect(source.abbr).toBe(undefined);
    expect(source.repositories).toHaveLength(0);
    expect(source.text).toBe(undefined);
    expect(source.title).toBe(undefined);
    expect(source.xref).toStrictEqual('@S1@');
    expect(source.gedcomRecord().text()).toStrictEqual([
      '0 @S1@ SOUR',
    ]);
  });

  test('order is maintained', () => {
    const gedcomText = [
      '0 @S1@ SOUR',
      '1 ABBR abbr',
      '1 TITL title',
      '1 TEXT text',
      '0 @S2@ SOUR',
      '1 TEXT text',
      '1 TITL title',
      '1 ABBR abbr',
    ];
    const records = Array.from(parseGedcomRecordsFromText(gedcomText.join('\n')));
    const sources = records.map((record) => new GedcomSource(record, ancestryService));
    expect(sources.flatMap((source) => source.gedcomRecord().text())).toStrictEqual(gedcomText);
  });
});
