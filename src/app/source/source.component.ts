import type {ElementRef} from '@angular/core';
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
import {SourceViewAbbrComponent} from './source-view-abbr.component';
import {SourceViewTitleComponent} from './source-view-title.component';
import {SourceViewTextComponent} from './source-view-text.component';
import {SourceViewRepositoryCitationsComponent} from './source-view-repository-citations.component';
import {SourceViewEventCitationsComponent} from './source-view-event-citations.component';
import {SourceViewUnknownsComponent} from './source-view-unknowns.component';
import {serializeSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';
import {GedcomSource} from '../../gedcom/gedcomSource';

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
    SourceViewAbbrComponent,
    SourceViewTitleComponent,
    SourceViewTextComponent,
    SourceViewRepositoryCitationsComponent,
    SourceViewEventCitationsComponent,
    SourceViewUnknownsComponent,
  ],
})
export class SourceComponent {
  readonly ancestryService = ancestryService;
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));
  gedcomRecord = computed(() => serializeSourceToGedcomRecord(this.source()));

  model = new GedcomSource('');
  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.model = this.source().clone();
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    this.ancestryService.records.update((records) => records.set(this.xref(), this.model!));
    this.editDialog().nativeElement.close();
  }
}
