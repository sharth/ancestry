import {AncestryService} from '../app/ancestry.service';

describe('GedcomIndividual', () => {
  it('Male', () => {
    const ancestryService = new AncestryService();
    ancestryService.parseText([
      '0 @I1@ INDI',
      '1 SEX M',
    ].join('\n'));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I1@').sex).toEqual('Male');
  });

  it('Female', () => {
    const ancestryService = new AncestryService();
    ancestryService.parseText([
      '0 @I2@ INDI',
      '1 SEX F',
    ].join('\r\n'));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I2@').sex).toEqual('Female');
  });

  it('UnspecifiedSex', () => {
    const ancestryService = new AncestryService();
    ancestryService.parseText([
      '0 @I3@ INDI',
    ].join('\n'));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I3@').sex).toEqual(undefined);
  });

  it('Family Search Id', () => {
    const ancestryService = new AncestryService();
    ancestryService.parseText([
      '0 @I4@ INDI',
      '1 _FSFTID abcd',
    ].join('\r\n'));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.individual('@I4@').familySearchId).toEqual('abcd');
  });
});
