import { type ComponentFixture, TestBed } from '@angular/core/testing'

import { SourceEditorComponent } from './source-editor.component'
import { Component } from '@angular/core'
import { AncestryService } from '../ancestry.service'

@Component({
  standalone: true,
  template: '<app-source-editor [xref]="xref" />',
  imports: [SourceEditorComponent]
})
class TestComponent {
  xref = '@S1@'
}

describe('SourceEditorComponent', () => {
  let component: TestComponent
  let fixture: ComponentFixture<TestComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceEditorComponent]
    })
      .compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().source('@S1@')

    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
