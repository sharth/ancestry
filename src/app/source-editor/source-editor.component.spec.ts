import { type ComponentFixture, TestBed } from '@angular/core/testing'

import { SourceEditorComponent } from './source-editor.component'
import { AncestryService } from '../ancestry.service'

describe('SourceEditorComponent', () => {
  let component: SourceEditorComponent
  let fixture: ComponentFixture<SourceEditorComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceEditorComponent]
    })
      .compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().source('@S1@')

    fixture = TestBed.createComponent(SourceEditorComponent)
    fixture.componentRef.setInput('xref', '@S1@')
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
