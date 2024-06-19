import {AncestryService} from './ancestry.service';

describe('AncestryService', () => {
  let ancestryService: AncestryService;
  beforeEach(() => {
    ancestryService = new AncestryService();
  });

  it('Empty on init', () => {
    expect(ancestryService.headers().size).toEqual(0);
    expect(ancestryService.trailers().size).toEqual(0);
    expect(ancestryService.individuals().size).toEqual(0);
    expect(ancestryService.families().size).toEqual(0);
    expect(ancestryService.sources().size).toEqual(0);
    expect(ancestryService.repositories().size).toEqual(0);
  });
});
