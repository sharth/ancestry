import type {ElementRef, OnInit} from '@angular/core';
import {Component, computed, input, viewChild} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoryCitationsComponent} from './source-edit-repository-citations.component';
import {SourceEditUnknownsComponent} from './source-edit-unknowns.component';
import {serializeSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import type {GedcomRepository} from '../../gedcom/gedcomRepository';

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
    SourceEditRepositoryCitationsComponent,
    SourceEditUnknownsComponent,
  ],
})
export class SourceComponent implements OnInit {
  readonly ancestryService = ancestryService;
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));
  gedcomRecord = computed(() => serializeSourceToGedcomRecord(this.source()));

  lookupRepository(repositoryXref?: string): GedcomRepository | undefined {
    if (repositoryXref == undefined) {
      return undefined;
    } else {
      return ancestryService.repository(repositoryXref);
    }
  }

  model!: GedcomSource;
  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  ngOnInit() {
    this.model = this.source();
  }

  openForm() {
    this.model = this.source().clone();
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    this.ancestryService.records.update((records) => records.set(this.xref(), this.model!));
    this.editDialog().nativeElement.close();
  }
}
