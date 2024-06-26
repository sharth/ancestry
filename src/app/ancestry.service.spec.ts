import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {AncestryService} from './ancestry.service';
import {TestBed} from '@angular/core/testing';

describe('AncestryService', () => {
  let ancestryService: AncestryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
    ancestryService = TestBed.inject(AncestryService);
  });

  test('Empty on init', () => {
    expect(ancestryService.headers().size).toEqual(0);
    expect(ancestryService.trailers().size).toEqual(0);
    expect(ancestryService.records().size).toEqual(0);
  });

  test('Track the originally passed in text', () => {
    const rawGedcomText =
      '0 @I1@ INDI\n';
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.originalGedcomText()).toEqual(rawGedcomText);
    // Even though we delete an individual, no change to the originally stored gedcom text is expected.
    ancestryService.records.update((records) => records.delete('@I1@'));
    expect(ancestryService.originalGedcomText()).toEqual(rawGedcomText);
  });

  test('Generated gedcom text matches', () => {
    const rawGedcomText =
      '0 @I1@ INDI\n';
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.gedcomText()).toEqual(rawGedcomText);
  });

  test('Remember order of insertion', () => {
    const rawGedcomText = [...Array(100).keys()]
        .map((i) => `0 @I${i}@ INDI\n`)
        .join('');
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.gedcomText()).toEqual(rawGedcomText);
  });

  test('Preserve order of individuals families and sources', () => {
    const rawGedcomText = Array.from(Array(100).keys())
        .flatMap((i) => [
          `0 @I${i}@ INDI\n`,
          `0 @S${i}@ SOUR\n`,
          `0 @R${i}@ REPO\n`,
          `0 @F${i}@ FAM\n`,
        ]).join('');
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.gedcomText()).toEqual(rawGedcomText);
  });
});
