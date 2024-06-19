import {AncestryService} from './ancestry.service';

describe('AncestryService', () => {
  let ancestryService: AncestryService;
  beforeEach(() => {
    ancestryService = new AncestryService();
  });

  it('Empty on init', () => {
    expect(ancestryService.header()).toEqual(undefined);
    expect(ancestryService.trailer()).toEqual(undefined);
    expect(ancestryService.individuals().size).toEqual(0);
    expect(ancestryService.families().size).toEqual(0);
    expect(ancestryService.sources().size).toEqual(0);
    expect(ancestryService.repositories().size).toEqual(0);
  });
});
