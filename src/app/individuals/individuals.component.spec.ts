import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {IndividualsComponent} from './individuals.component';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';

describe('IndividualsComponent', () => {
  let component: IndividualsComponent;
  let fixture: ComponentFixture<IndividualsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(IndividualsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
