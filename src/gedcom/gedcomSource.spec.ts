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

  test.each([
    {gedcomArray: [
      '0 @S1@ SOUR',
    ]},
    {gedcomArray: [
      '0 @S1@ SOUR',
      '1 ABBR abbr',
      '1 TITL title',
      '1 TEXT text',
    ]},
    {gedcomArray: [
      '0 @S2@ SOUR',
      '1 TEXT text',
      '1 TITL title',
      '1 ABBR abbr',
    ]},
    {gedcomArray: [
      '0 @S10@ SOUR',
      '1 ABBR abbr',
      '1 TITL title',
      '1 _SUBQ subq',
      '1 _BIBL bibl',
      '1 _WEBTAG',
      '2 NAME webtag name',
      '2 URL webtag url',
      '1 _TMPLT',
      '2 TID 72',
      '2 FIELD',
      '3 NAME Agency',
      '3 VALUE Florida',
      '2 FIELD',
      '3 NAME Repository',
      '2 FIELD',
      '3 NAME RepositoryLoc',
      '1 TEXT text ',
      '2 CONT and more text',
    ]},
  ])('incoming gedcom matches outgoing gedcom', ({gedcomArray}) => {
    const records = Array.from(parseGedcomRecordsFromText(gedcomArray.join('\n')));
    const sources = records.map((record) => new GedcomSource(record, ancestryService));
    expect(sources.flatMap((source) => source.gedcomRecord().text())).toStrictEqual(gedcomArray);
  });
});
