import {GedcomFamily} from './gedcomFamily';
import {GedcomIndividual} from './gedcomIndividual';

describe('GedcomFamily', () => {
  it('parents', () => {
    const gedcomFamily = new GedcomFamily('@F1@');
    const parents = [new GedcomIndividual('@I1@'), new GedcomIndividual('@I2@')];
    expect(gedcomFamily.parents()).toEqual([]);
    gedcomFamily.wife = parents[1];
    expect(gedcomFamily.parents()).toEqual([parents[1]]);
    gedcomFamily.husband = parents[0];
    expect(gedcomFamily.parents()).toEqual(parents);
  });
});
