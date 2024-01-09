import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { IndividualsComponent } from './individuals.component'

describe('IndividualsComponent', () => {
  let component: IndividualsComponent
  let fixture: ComponentFixture<IndividualsComponent>

  beforeEach(async () => {
    fixture = TestBed.createComponent(IndividualsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
