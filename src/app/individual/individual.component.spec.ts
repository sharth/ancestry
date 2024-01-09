import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { IndividualComponent } from './individual.component'
import { Component } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { RouterTestingModule } from '@angular/router/testing'

@Component({
  standalone: true,
  template: '<app-individual [xref]="xref" />',
  imports: [IndividualComponent]
})
class TestComponent {
  xref = '@I1@'
}

describe('IndividualComponent', () => {
  let component: TestComponent
  let fixture: ComponentFixture<TestComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    }).compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().individual('@I1@')

    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
