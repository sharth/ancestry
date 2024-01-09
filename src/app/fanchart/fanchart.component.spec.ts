import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { FanchartComponent } from './fanchart.component'

describe('FanchartComponent', () => {
  let component: FanchartComponent
  let fixture: ComponentFixture<FanchartComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FanchartComponent]
    })
      .compileComponents()

    fixture = TestBed.createComponent(FanchartComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
