import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {IndividualComponent} from './individual.component';
import {AncestryService} from '../ancestry.service';
import {provideRouter} from '@angular/router';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {GedcomRecord} from '../../gedcom/gedcomRecord';
import {GedcomParser} from '../../gedcom/gedcomParser';

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

    const ancestryService = TestBed.inject(AncestryService);
    const gedcomParser = new GedcomParser(ancestryService);
    gedcomParser.parse(new GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, []));

    fixture = TestBed.createComponent(IndividualComponent);
    fixture.componentRef.setInput('xref', '@I1@');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
