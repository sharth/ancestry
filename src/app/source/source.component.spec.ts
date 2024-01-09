import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { SourceComponent } from './source.component'
import { Component } from '@angular/core'
import { AncestryService } from '../ancestry.service'

@Component({
  standalone: true,
  template: '<app-source [xref]="xref" />',
  imports: [SourceComponent]
})
class TestComponent {
  xref = '@S1@'
}

describe('SourceComponent', () => {
  let component: TestComponent
  let fixture: ComponentFixture<TestComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
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
