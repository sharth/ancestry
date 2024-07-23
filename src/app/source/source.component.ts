import type {ElementRef, OnInit} from '@angular/core';
import {Component, computed, input, viewChild} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import type {GedcomRecord} from '../../gedcom/gedcomRecord';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoriesComponent} from './source-edit-repositories.component';
import {SourceEditUnknownsComponent} from './source-edit-unknowns.component';
import {SourceViewAbbrComponent} from './source-view-abbr.component';
import {SourceViewTitleComponent} from './source-view-title.component';
import {SourceViewTextComponent} from './source-view-text.component';
import {SourceViewRepositoriesComponent} from './source-view-repositories.component';
import {SourceViewCitationsComponent} from './source-view-citations.component';
import {SourceViewUnknownsComponent} from './source-view-unknowns.component';
import {serializeSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';

@Component({
  selector: 'app-source',
  standalone: true,
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SourceEditAbbrComponent,
    SourceEditTitleComponent,
    SourceEditTextComponent,
    SourceEditRepositoriesComponent,
    SourceEditUnknownsComponent,
    SourceViewAbbrComponent,
    SourceViewTitleComponent,
    SourceViewTextComponent,
    SourceViewRepositoriesComponent,
    SourceViewCitationsComponent,
    SourceViewUnknownsComponent,
  ],
})
export class SourceComponent implements OnInit {
  readonly ancestryService = ancestryService;
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));
  gedcomRecord = computed(() => serializeSourceToGedcomRecord(this.source()));

  model?: {
    abbr: string
    title: string
    text: string
    repositories: {repositoryXref: string, callNumber: string}[]
    unknowns: GedcomRecord[]
  };
  ngOnInit(): void {
    this.model = {
      abbr: this.source().abbr ?? '',
      title: this.source().title ?? '',
      text: this.source().text ?? '',
      repositories: this.source().repositories
          .flatMap((repository) => repository.callNumbers
              .map((callNumber) => ({
                repositoryXref: repository.repositoryXref,
                callNumber: callNumber,
              }))),
      unknowns: this.source().unknownRecords,
    };
  }

  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    this.ancestryService.records.update((records) => records.set(this.xref(), this.source().modify({
      abbr: this.model!.abbr,
      text: this.model!.text,
      title: this.model!.title,
      repositories: this.model!.repositories,
      unknownRecords: this.model!.unknowns,
    })));
    this.editDialog().nativeElement.close();
  }
}
