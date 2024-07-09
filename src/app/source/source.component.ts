import type {ElementRef, OnInit} from '@angular/core';
import {Component, computed, inject, input, viewChild} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
    CommonModule, RouterModule, FormsModule,
    SourceEditAbbrComponent, SourceEditTitleComponent, SourceEditTextComponent,
    SourceEditRepositoriesComponent,
  ],
})
export class SourceComponent implements OnInit {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  model?: {
    abbr: string
    title: string
    text: string
    repositories: {
      repositoryXref: string
      callNumber: string
    }[]
  };
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
    this.ancestryService.records.update((records) => records.set(this.xref(), this.source().modify({
      abbr: this.model?.abbr,
      text: this.model?.text,
      title: this.model?.title,
      repositories: this.model?.repositories ?? [],
    })));
    this.editDialog().nativeElement.close();
  }
}
