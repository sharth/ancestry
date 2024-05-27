import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { IndexComponent } from './index.component'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'

describe('IndexComponent', () => {
  let component: IndexComponent
  let fixture: ComponentFixture<IndexComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()]
    }).compileComponents()

    fixture = TestBed.createComponent(IndexComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
