import { GedcomDatabase } from './gedcomDatabase'
import { GedcomParser } from './gedcomParser'

describe('GedcomParser', () => {
  let gedcomDatabase: GedcomDatabase
  let gedcomParser: GedcomParser

  beforeEach(async () => {
    gedcomDatabase = new GedcomDatabase()
    gedcomParser = new GedcomParser(gedcomDatabase)
  })

  it('parse two individuals', async () => {
    await gedcomParser.parseText([
      '0 @I1@ INDI',
      '0 @I2@ INDI'
    ].join('\r\n'))
    expect(gedcomDatabase.individuals.size).toEqual(2)
  })
})
