import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {IndividualComponent} from './individual.component';
import {ancestryService} from '../ancestry.service';
import {provideRouter} from '@angular/router';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {assert} from "chai";

describe('IndividualComponent', () => {
  let component: IndividualComponent;
  let fixture: ComponentFixture<IndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualComponent],
      providers: [
        provideRouter([]),
        provideExperimentalZonelessChangeDetection(),
      ],
    }).compileComponents();

    ancestryService.parseText([
      '0 @I1@ INDI',
    ].join('\n'));

    fixture = TestBed.createComponent(IndividualComponent);
    fixture.componentRef.setInput('xref', '@I1@');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    assert.isTrue(component);
  });
});
