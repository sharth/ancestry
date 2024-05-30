import {GedcomDatabase} from './gedcomDatabase';
import {GedcomParser} from './gedcomParser';
import {GedcomRecord} from './gedcomRecord';

describe('GedcomParser', () => {
  let gedcomDatabase: GedcomDatabase;
  let gedcomParser: GedcomParser;

  beforeEach(async () => {
    gedcomDatabase = new GedcomDatabase();
    gedcomParser = new GedcomParser(gedcomDatabase);
  });

  it('parse two individuals', () => {
    gedcomParser.parse(new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined));
    gedcomParser.parse(new GedcomRecord(0, '@I2@', 'INDI', 'INDI', undefined));
    expect(gedcomDatabase.individuals.size).toEqual(2);
  });
});
