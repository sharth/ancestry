import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {RepositoryComponent} from './repository.component';
import {AncestryService} from '../ancestry.service';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';

describe('RepositoryComponent', () => {
  let component: RepositoryComponent;
  let fixture: ComponentFixture<RepositoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    const ancestryService = TestBed.inject(AncestryService);
    ancestryService.parseText([
      '0 @R1@ REPO',
    ].join('\n'));

    fixture = TestBed.createComponent(RepositoryComponent);
    fixture.componentRef.setInput('xref', '@R1@');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
