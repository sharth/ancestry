import { AncestryService } from './ancestry.service'

describe('AncestryService', () => {
  let ancestryService: AncestryService
  beforeEach(() => {
    ancestryService = new AncestryService()
  })

  it('Empty on reset', () => {
    ancestryService.reset()
    expect(ancestryService.individuals()).toEqual([])
    expect(ancestryService.families()).toEqual([])
    expect(ancestryService.sources()).toEqual([])
  })
})
