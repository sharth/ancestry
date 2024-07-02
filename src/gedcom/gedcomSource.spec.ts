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
    const source = GedcomSource.constructFromGedcom(records[0], ancestryService);
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
    const sources = records.map((record) => GedcomSource.constructFromGedcom(record, ancestryService));
    expect(sources.flatMap((source) => source.gedcomRecord().text())).toStrictEqual(gedcomArray);
  });

  test('citations', () => {
    const gedcomArray = [
      '0 @I0@ INDI',
      '0 @I1@ INDI',
      '1 BIRT',
      '2 SOUR @S1@',
      '1 DEAT Y',
      '2 SOUR @S4@',
      '2 SOUR @S1@',
      '1 BURI',
      '2 SOUR @S2@',
      '0 @S1@ SOUR',
      '0 @S2@ SOUR',
      '0 @S3@ SOUR',
      '0 @S4@ SOUR',
    ];
    ancestryService.parseText(gedcomArray.join('\n'));
    const individual = ancestryService.individual('@I1@');
    const birthEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'BIRT')[0];
    const deathEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'DEAT')[0];
    const burialEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'BURI')[0];
    expect(ancestryService.source('@S1@').citations()).toStrictEqual([
      {individual: individual, event: birthEvent, citation: birthEvent.citations[0]},
      {individual: individual, event: deathEvent, citation: deathEvent.citations[1]},
    ]);
    expect(ancestryService.source('@S2@').citations()).toStrictEqual([
      {individual: individual, event: burialEvent, citation: burialEvent.citations[0]},
    ]);
    expect(ancestryService.source('@S3@').citations()).toStrictEqual([]);
    expect(ancestryService.source('@S4@').citations()).toStrictEqual([
      {individual: individual, event: deathEvent, citation: deathEvent.citations[0]},
    ]);
  });

  test('clone', () => {
    const gedcomSource = new GedcomSource('@S1@', ancestryService).updateAbbr('abbr');
    const clonedSource = gedcomSource.clone();
    expect(gedcomSource).not.toBe(clonedSource);
    expect(gedcomSource.abbr).toBe(clonedSource.abbr);
  });

  test('Change abbr from null to null', () => {
    const gedcomSource = new GedcomSource('@S1@', ancestryService);
    const changedSource = gedcomSource.updateAbbr(null);
    expect(changedSource).toBe(gedcomSource);
    expect(changedSource.abbr).toBeUndefined;
  });

  test('Change abbr from null to value', () => {
    const gedcomSource = new GedcomSource('@S1@', ancestryService);
    const changedSource = gedcomSource.updateAbbr('new value');
    expect(changedSource).not.toBe(gedcomSource);
    expect(changedSource.abbr?.value).toStrictEqual('new value');
    expect(gedcomSource.abbr).toBeUndefined;
  });

  test('Change abbr from value to null', () => {
    const gedcomSource = new GedcomSource('@S1@', ancestryService).updateAbbr('old');
    const changedSource = gedcomSource.updateAbbr(null);
    expect(changedSource).not.toBe(gedcomSource);
    expect(changedSource.abbr).toBeUndefined;
    expect(gedcomSource.abbr?.value).toStrictEqual('old');
  });

  test('Change abbr from value to another value', () => {
    const gedcomSource = new GedcomSource('@S1@', ancestryService).updateAbbr('old');
    const changedSource = gedcomSource.updateAbbr('new');
    expect(changedSource).not.toBe(gedcomSource);
    expect(changedSource.abbr?.value).toStrictEqual('new');
    expect(gedcomSource.abbr?.value).toStrictEqual('old');
  });
});
