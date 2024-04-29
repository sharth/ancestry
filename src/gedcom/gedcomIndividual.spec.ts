import { GedcomDatabase } from './gedcomDatabase'
import { GedcomParser } from './gedcomParser'
import { GedcomRecord } from './gedcomRecord'

describe('GedcomIndividual', () => {
  let gedcomDatabase: GedcomDatabase
  let gedcomParser: GedcomParser

  beforeEach(async () => {
    gedcomDatabase = new GedcomDatabase()
    gedcomParser = new GedcomParser(gedcomDatabase)
  })

  it('Male', () => {
    gedcomParser.parse(
      new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
        new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'M'),
      ])
    )
    expect(gedcomDatabase.individuals.size).toEqual(1)
    expect(gedcomDatabase.individual('@I1@').sex).toEqual('Male')
  })

  it('Female', () => {
    gedcomParser.parse(
      new GedcomRecord(0, '@I2@', 'INDI', 'INDI', undefined, [
        new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'F'),
      ])
    )
    expect(gedcomDatabase.individual('@I2@').sex).toEqual('Female')
  })

  it('UnspecifiedSex', () => {
    gedcomParser.parse(
      new GedcomRecord(0, '@I3@', 'INDI', 'INDI', undefined, []),
    )
    expect(gedcomDatabase.individual('@I3@').sex).toEqual(undefined)
  })

  it('Family Search Id', async () => {
    gedcomParser.parse(
      new GedcomRecord(0, '@I4@', 'INDI', 'INDI', undefined, [
        new GedcomRecord(1, undefined, '_FSFTID', 'INDI._FSFTID', 'family_search_id'),
      ])
    )
    expect(gedcomDatabase.individuals.size).toEqual(1)
    expect(gedcomDatabase.individual('@I4@').familySearchId).toEqual('family_search_id')
  })
})
