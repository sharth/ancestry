import type {ElementRef} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {Component, computed, inject, input, viewChild} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
})
export class SourceComponent {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  sourceForm = new FormGroup({
    abbr: new FormControl(''),
    title: new FormControl(''),
    text: new FormControl(''),
  });

  openForm() {
    this.sourceForm.setValue({
      abbr: this.source().abbr?.value ?? '',
      title: this.source().title?.value ?? '',
      text: this.source().text?.value ?? '',
    });
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    const source = this.source();
    const sourceForm = this.sourceForm;
    console.log(this.sourceForm.value);
    this.ancestryService.records.update((records) => records.set(source.xref, source
        .updateAbbr(sourceForm.value.abbr || null)
        .updateText(sourceForm.value.text || null)
        .updateTitle(sourceForm.value.title || null)));
    this.editDialog().nativeElement.close();
  }
}
