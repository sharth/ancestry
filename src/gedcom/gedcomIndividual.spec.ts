import { GedcomDatabase } from './gedcomDatabase'
import { GedcomParser } from './gedcomParser'

describe('GedcomParser', () => {
  let gedcomDatabase: GedcomDatabase
  let gedcomParser: GedcomParser

  beforeEach(async () => {
    gedcomDatabase = new GedcomDatabase()
    gedcomParser = new GedcomParser(gedcomDatabase)
  })

  it('Sex', async () => {
    await gedcomParser.parseText([
      '0 @I1@ INDI',
      '1 SEX M',
      '0 @I2@ INDI',
      '1 SEX F',
      '0 @I3@ INDI'
    ].join('\r\n'))
    expect(gedcomDatabase.individuals.size).toEqual(3)
    expect(gedcomDatabase.individual('@I1@').sex).toEqual('Male')
    expect(gedcomDatabase.individual('@I2@').sex).toEqual('Female')
    expect(gedcomDatabase.individual('@I3@').sex).toEqual(undefined)
  })

  it('Family Search Id', async () => {
    await gedcomParser.parseText([
      '0 @I1@ INDI',
      '1 _FSFTID family_search_id'
    ].join('\r\n'))
    expect(gedcomDatabase.individuals.size).toEqual(1)
    expect(gedcomDatabase.individual('@I1@').familySearchId).toEqual('family_search_id')
  })
})
