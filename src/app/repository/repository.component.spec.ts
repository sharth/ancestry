import { type ComponentFixture, TestBed } from '@angular/core/testing'

import { RepositoryComponent } from './repository.component'
import { AncestryService } from '../ancestry.service'

describe('RepositoryComponent', () => {
  let component: RepositoryComponent
  let fixture: ComponentFixture<RepositoryComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryComponent]
    })
      .compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().repository('@R1@')

    fixture = TestBed.createComponent(RepositoryComponent)
    fixture.componentRef.setInput('xref', '@R1@')
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
