import {AncestryService} from '../app/ancestry.service';
import {GedcomParser} from './gedcomParser';
import {GedcomRecord} from './gedcomRecord';

describe('GedcomParser', () => {
  let ancestryService: AncestryService;
  let gedcomParser: GedcomParser;

  beforeEach(async () => {
    ancestryService = new AncestryService();
    gedcomParser = new GedcomParser(ancestryService);
  });

  it('parse two individuals', () => {
    gedcomParser.parse(new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined));
    gedcomParser.parse(new GedcomRecord(0, '@I2@', 'INDI', 'INDI', undefined));
    expect(ancestryService.individuals().size).toEqual(2);
  });
});
