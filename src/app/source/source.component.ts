import type {ElementRef, OnInit} from '@angular/core';
import {Component, computed, inject, input, viewChild} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import type {SourceModel} from './source-model';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoriesComponent} from './source-edit-repositories.component';

@Component({
  selector: 'app-source',
  standalone: true,
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
  imports: [
    CommonModule, RouterModule,
    SourceEditAbbrComponent, SourceEditTitleComponent, SourceEditTextComponent,
    SourceEditRepositoriesComponent,
  ],
})
export class SourceComponent implements OnInit {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  model?: SourceModel;
  ngOnInit(): void {
    this.model = {
      abbr: this.source().abbr?.value ?? '',
      title: this.source().title?.value ?? '',
      text: this.source().text?.value ?? '',
      repositories: [],
    };
  }

  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    const newSource = this.source()
        .updateAbbr(this.model?.abbr || null)
        .updateText(this.model?.text || null)
        .updateTitle(this.model?.title || null);
    this.ancestryService.records.update((records) => records.set(newSource.xref, newSource));
    this.editDialog().nativeElement.close();
  }
}
