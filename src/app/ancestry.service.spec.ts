import {AncestryService} from './ancestry.service';

describe('AncestryService', () => {
  let ancestryService: AncestryService;
  beforeEach(() => {
    ancestryService = new AncestryService();
  });

  it('Empty on init', () => {
    expect([...ancestryService.individuals().values()]).toEqual([]);
    expect([...ancestryService.families().values()]).toEqual([]);
    expect([...ancestryService.sources().values()]).toEqual([]);
  });
});
