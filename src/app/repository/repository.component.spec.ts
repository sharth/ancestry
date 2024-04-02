import { type ComponentFixture, TestBed } from '@angular/core/testing'

import { RepositoryComponent } from './repository.component'
import { Component } from '@angular/core'
import { AncestryService } from '../ancestry.service'

@Component({
  standalone: true,
  template: '<app-repository [xref]="xref" />',
  imports: [RepositoryComponent]
})
class TestComponent {
  xref = '@R1@'
}

describe('RepositoryComponent', () => {
  let component: TestComponent
  let fixture: ComponentFixture<TestComponent>
  let ancestryService: AncestryService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryComponent]
    })
      .compileComponents()

    ancestryService = TestBed.inject(AncestryService)
    ancestryService.database().repository('@R1@')

    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
