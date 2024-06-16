import {GedcomFamily} from './gedcomFamily';

describe('GedcomFamily', () => {
  it('parents', () => {
    const gedcomFamily = new GedcomFamily('@F1@');
    expect(gedcomFamily.parentXrefs()).toEqual([]);
    gedcomFamily.wifeXref = '@I2@';
    expect(gedcomFamily.parentXrefs()).toEqual(['@I2@']);
    gedcomFamily.husbandXref = '@I1@';
    expect(gedcomFamily.parentXrefs()).toEqual(['@I1@', '@I2@']);
  });
});
