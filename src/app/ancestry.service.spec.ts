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
});
