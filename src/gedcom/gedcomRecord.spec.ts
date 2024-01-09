import { GedcomRecord } from './gedcomRecord'

describe('GedcomRecord', () => {
  let gedcomRecord: GedcomRecord

  beforeEach(async () => {
    gedcomRecord = new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined)
    gedcomRecord.children.push(new GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe\nsenior'))
  })

  it('validate gedcom', () => {
    expect(gedcomRecord.gedcom()).toEqual([
      '0 @I1@ INDI',
      '1 NAME john doe',
      '2 CONT senior'
    ])
  })
})
