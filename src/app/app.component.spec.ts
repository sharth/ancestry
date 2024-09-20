import {TestBed, type ComponentFixture} from '@angular/core/testing';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {AppComponent} from './app.component';
import {RouterModule} from '@angular/router';
import {assert} from "chai";

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    assert.isTrue(component);
  });
});
