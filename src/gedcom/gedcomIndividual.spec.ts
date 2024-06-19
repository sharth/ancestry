import {AncestryService} from '../app/ancestry.service';
import {GedcomParser} from './gedcomParser';
import {GedcomRecord} from './gedcomRecord';

describe('GedcomIndividual', () => {
  let ancestryService: AncestryService;
  let gedcomParser: GedcomParser;

  beforeEach(async () => {
    ancestryService = new AncestryService();
    gedcomParser = new GedcomParser(ancestryService);
  });

  it('Male', () => {
    gedcomParser.parse(
        new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
          new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'M'),
        ]));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I1@').sex).toEqual('Male');
  });

  it('Female', () => {
    gedcomParser.parse(
        new GedcomRecord(0, '@I2@', 'INDI', 'INDI', undefined, [
          new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'F'),
        ]));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I2@').sex).toEqual('Female');
  });

  it('UnspecifiedSex', () => {
    gedcomParser.parse(
        new GedcomRecord(0, '@I3@', 'INDI', 'INDI', undefined, []),
    );
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I3@').sex).toEqual(undefined);
  });

  it('Family Search Id', () => {
    gedcomParser.parse(
        new GedcomRecord(0, '@I4@', 'INDI', 'INDI', undefined, [
          new GedcomRecord(1, undefined, '_FSFTID', 'INDI._FSFTID', 'family_search_id'),
        ]),
    );
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I4@').familySearchId).toEqual('family_search_id');
  });
});
