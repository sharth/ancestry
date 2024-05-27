import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { SourceDetailComponent } from './source-detail.component'
import { AncestryService } from '../ancestry.service'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'

describe('SourceDetailComponent', () => {
  let component: SourceDetailComponent
  let fixture: ComponentFixture<SourceDetailComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()]
    }).compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().source('@S1@')

    fixture = TestBed.createComponent(SourceDetailComponent)
    fixture.componentRef.setInput('xref', '@S1@')
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
