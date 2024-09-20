import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {SourceComponent} from './source.component';
import {ancestryService} from '../ancestry.service';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {assert} from "chai";

describe('SourceComponent', () => {
  let component: SourceComponent;
  let fixture: ComponentFixture<SourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    ancestryService.parseText([
      '0 @S1@ SOUR',
    ].join('\n'));

    fixture = TestBed.createComponent(SourceComponent);
    fixture.componentRef.setInput('xref', '@S1@');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    assert.isTrue(component);
  });

  it('open dialog', () => {
    component.openForm();
  });
});
