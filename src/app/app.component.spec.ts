import {AncestryService} from './ancestry.service';
import {TestBed, type ComponentFixture} from '@angular/core/testing';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {AppComponent} from './app.component';
import {RouterModule} from '@angular/router';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let ancestryService: AncestryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    ancestryService = TestBed.inject(AncestryService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Empty on init', () => {
    expect(ancestryService.headers().size).toEqual(0);
    expect(ancestryService.trailers().size).toEqual(0);
    expect(ancestryService.individuals().size).toEqual(0);
    expect(ancestryService.families().size).toEqual(0);
    expect(ancestryService.sources().size).toEqual(0);
    expect(ancestryService.repositories().size).toEqual(0);
  });

  it('Each initialization should reset previous records', () => {
    expect(ancestryService.gedcomRecords()).toHaveLength(0);
    // Reset, and initialize to two individuals.
    component.parseSomeText([
      '0 @I1@ INDI',
      '0 @I2@ INDI',
    ].join('\n'));
    expect(ancestryService.individuals().size).toEqual(2);
    expect(ancestryService.gedcomRecords()).toHaveLength(2);
    // Reset, and initialize to one individual.
    component.parseSomeText([
      '0 @I3@ INDI',
    ].join('\n'));
    expect(ancestryService.individuals().size).toEqual(1);
    expect(ancestryService.gedcomRecords()).toHaveLength(1);
    // Reset, and initialize to an empty database.
    component.parseSomeText('');
    expect(ancestryService.individuals().size).toEqual(0);
    expect(ancestryService.gedcomRecords()).toHaveLength(0);
  });
});
