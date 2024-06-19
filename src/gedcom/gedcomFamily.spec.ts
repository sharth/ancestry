import {AncestryService} from '../app/ancestry.service';

describe('GedcomFamily', () => {
  it('Parents', () => {
    const ancestryService = new AncestryService();
    ancestryService.parseText([
      '0 @F1@ FAM',
      '0 @F2@ FAM',
      '1 WIFE @I1@',
      '0 @F3@ FAM',
      '1 WIFE @I2@',
      '1 HUSB @I3@',
    ].join('\n'));
    expect(ancestryService.family('@F1@').parentXrefs).toEqual([]);
    expect(ancestryService.family('@F2@').parentXrefs).toEqual(['@I1@']);
    expect(ancestryService.family('@F3@').parentXrefs).toEqual(['@I3@', '@I2@']);
  });
});
