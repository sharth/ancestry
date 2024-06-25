import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {AncestryService} from './ancestry.service';
import {TestBed} from '@angular/core/testing';

describe('AncestryService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  it('Empty on init', () => {
    const ancestryService = TestBed.inject(AncestryService);
    expect(ancestryService.headers().size).toEqual(0);
    expect(ancestryService.trailers().size).toEqual(0);
    expect(ancestryService.individuals().size).toEqual(0);
    expect(ancestryService.families().size).toEqual(0);
    expect(ancestryService.sources().size).toEqual(0);
    expect(ancestryService.repositories().size).toEqual(0);
  });

  it('Track the originally passed in text', () => {
    const ancestryService = TestBed.inject(AncestryService);
    const rawGedcomText =
      '0 @I1@ INDI\n';
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.originalGedcomText()).toEqual(rawGedcomText);
    // Even though we delete an individual, no change to the originally stored gedcom text is expected.
    ancestryService.individuals.update((individuals) => individuals.delete('@I1@'));
    expect(ancestryService.originalGedcomText()).toEqual(rawGedcomText);
  });

  it('Generated gedcom text matches', () => {
    const ancestryService = TestBed.inject(AncestryService);
    const rawGedcomText =
      '0 @I1@ INDI\n';
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.gedcomText()).toEqual(rawGedcomText);
  });

  it('Remember order of insertion', () => {
    const ancestryService = TestBed.inject(AncestryService);
    const rawGedcomText = [...Array(100).keys()]
        .map((i) => `0 @I${i}@ INDI\n`)
        .join('');
    ancestryService.parseText(rawGedcomText);
    expect(ancestryService.gedcomText()).toEqual(rawGedcomText);
  });
});
