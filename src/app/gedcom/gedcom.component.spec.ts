import type {ComponentFixture} from '@angular/core/testing';
import {TestBed} from '@angular/core/testing';
import {GedcomComponent} from './gedcom.component';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {assert} from "chai";

describe('GedcomComponent', () => {
  let component: GedcomComponent;
  let fixture: ComponentFixture<GedcomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GedcomComponent],
      providers: [
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GedcomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    assert.isTrue(component);
  });
});
