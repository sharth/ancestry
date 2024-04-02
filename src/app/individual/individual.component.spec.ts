import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { IndividualComponent } from './individual.component'
import { AncestryService } from '../ancestry.service'
import { provideRouter } from '@angular/router'

describe('IndividualComponent', () => {
  let component: IndividualComponent
  let fixture: ComponentFixture<IndividualComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualComponent],
      providers: [provideRouter([])]
    }).compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().individual('@I1@')

    fixture = TestBed.createComponent(IndividualComponent)
    fixture.componentRef.setInput('xref', '@I1@')
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
