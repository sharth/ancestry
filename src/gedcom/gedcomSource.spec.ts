import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import { assert } from 'chai';
import { constructSourceFromGedcomRecord, parseGedcomRecordsFromText } from '../util/gedcom-parser';
import { serializeGedcomRecordToText, serializeGedcomSourceToGedcomRecord } from '../util/gedcom-serializer';

describe('GedcomSource', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();
  });

  it('empty source has reasonable gedcom', () => {
    const gedcomText = '0 @S1@ SOUR\n';
    const [source] = parseGedcomRecordsFromText(gedcomText).map(constructSourceFromGedcomRecord);
    assert.equal(source, {
      xref: '@S1@',
      repositoryCitations: [],
      unknownRecords: [],
      multimediaXrefs: [],
    });
    assert.equal(
      gedcomText,
      serializeGedcomRecordToText(serializeGedcomSourceToGedcomRecord(source)).join('\n'));
  });

  it('Test some fields', () => {
    const gedcomArray = [
      '0 @S10@ SOUR',
      '1 ABBR abbr',
      '1 TITL title',
      '1 TEXT text',
      '1 _SUBQ subq',
      '1 _BIBL bibl',
      '1 _WEBTAG',
      '2 NAME webtag',
      '2 URL url',
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
    ];
    const gedcomText = gedcomArray.join('\n');
    const [source] = parseGedcomRecordsFromText(gedcomText).map(constructSourceFromGedcomRecord);
    assert.equal(source, {
      xref: '@S10@',
      abbr: 'abbr',
      title: 'title',
      text: 'text',
      repositoryCitations: [],
      unknownRecords: [],
      multimediaXrefs: [],
    });
    assert.equal(
      gedcomText,
      serializeGedcomRecordToText(serializeGedcomSourceToGedcomRecord(source)).join('\n'));
  });
  

  // it.each([
  //   {gedcomArray: [
  //     '0 @S1@ SOUR',
  //   ]},
  //   {gedcomArray: [
  //     '0 @S1@ SOUR',
  //     '1 ABBR abbr',
  //     '1 TITL title',
  //     '1 TEXT text',
  //   ]},
  //   {gedcomArray: [
  //     '0 @S2@ SOUR',
  //     '1 TEXT text',
  //     '1 TITL title',
  //     '1 ABBR abbr',
  //   ]},
  //   {gedcomArray: [
  //     '0 @S10@ SOUR',
  //     '1 ABBR abbr',
  //     '1 TITL title',
  //     '1 _SUBQ subq',
  //     '1 _BIBL bibl',
  //     '1 _WEBTAG',
  //     '2 NAME webtag name',
  //     '2 URL webtag url',
  //     '1 _TMPLT',
  //     '2 TID 72',
  //     '2 FIELD',
  //     '3 NAME Agency',
  //     '3 VALUE Florida',
  //     '2 FIELD',
  //     '3 NAME Repository',
  //     '2 FIELD',
  //     '3 NAME RepositoryLoc',
  //     '1 TEXT text ',
  //     '2 CONT and more text',
  //   ]},
  // ])('incoming gedcom matches outgoing gedcom', ({gedcomArray}) => {
  //   const generatedText = gedcom.parseGedcomRecordsFromText(gedcomArray.join('\n'))
  //     .map(gedcom.constructSourceFromGedcomRecord)
  //     .map(gedcom.serializeGedcomSourceToGedcomRecord)
  //     .flatMap(gedcom.serializeGedcomRecordToText);
  //   expect(generatedText).toStrictEqual(gedcomArray);
  // });

  // it('citations', () => {
  //   const gedcomArray = [
  //     '0 @I0@ INDI',
  //     '0 @I1@ INDI',
  //     '1 BIRT',
  //     '2 SOUR @S1@',
  //     '1 DEAT Y',
  //     '2 SOUR @S4@',
  //     '2 SOUR @S1@',
  //     '1 BURI',
  //     '2 SOUR @S2@',
  //     '0 @S1@ SOUR',
  //     '0 @S2@ SOUR',
  //     '0 @S3@ SOUR',
  //     '0 @S4@ SOUR',
  //   ];
  //   ancestryService.parseText(gedcomArray.join('\n'));
  //   const individual = ancestryService.individual('@I1@');
  //   const birthEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'BIRT')[0];
  //   const deathEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'DEAT')[0];
  //   const burialEvent = individual.events.filter((event) => event.gedcomRecord().tag == 'BURI')[0];
  //   expect(ancestryService.source('@S1@').citations()).toStrictEqual([
  //     {individual: individual, event: birthEvent, citation: birthEvent.citations[0]},
  //     {individual: individual, event: deathEvent, citation: deathEvent.citations[1]},
  //   ]);
  //   expect(ancestryService.source('@S2@').citations()).toStrictEqual([
  //     {individual: individual, event: burialEvent, citation: burialEvent.citations[0]},
  //   ]);
  //   expect(ancestryService.source('@S3@').citations()).toStrictEqual([]);
  //   expect(ancestryService.source('@S4@').citations()).toStrictEqual([
  //     {individual: individual, event: deathEvent, citation: deathEvent.citations[0]},
  //   ]);
  // });
});
