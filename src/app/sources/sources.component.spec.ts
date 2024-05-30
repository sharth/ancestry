import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {SourcesComponent} from './sources.component';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';

describe('SourcesComponent', () => {
  let component: SourcesComponent;
  let fixture: ComponentFixture<SourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    })
        .compileComponents();

    fixture = TestBed.createComponent(SourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
