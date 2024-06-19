import {AncestryService} from '../app/ancestry.service';
import {GedcomParser} from './gedcomParser';
import {GedcomRecord} from './gedcomRecord';

describe('GedcomFamily', () => {
  let ancestryService: AncestryService;
  let gedcomParser: GedcomParser;

  beforeEach(async () => {
    ancestryService = new AncestryService();
    gedcomParser = new GedcomParser(ancestryService);
  });

  it('Parents', () => {
    gedcomParser.parse(
        new GedcomRecord(0, '@F1@', 'FAM', 'FAM', undefined, []));
    gedcomParser.parse(
        new GedcomRecord(0, '@F2@', 'FAM', 'FAM', undefined, [
          new GedcomRecord(1, undefined, 'WIFE', 'FAM.WIFE', '@I1@', []),
        ]));
    gedcomParser.parse(
        new GedcomRecord(0, '@F3@', 'FAM', 'FAM', undefined, [
          new GedcomRecord(1, undefined, 'WIFE', 'FAM.WIFE', '@I1@', []),
          new GedcomRecord(1, undefined, 'HUSB', 'FAM.HUSB', '@I2@', []),
        ]));
    expect(ancestryService.family('@F1@').parentXrefs).toEqual([]);
    expect(ancestryService.family('@F2@').parentXrefs).toEqual(['@I1@']);
    expect(ancestryService.family('@F3@').parentXrefs).toEqual(['@I2@', '@I1@']);
  });
});
