import type {ElementRef} from '@angular/core';
import {Component, computed, inject, input, viewChild} from '@angular/core';
import type {FormArray, FormControl, FormGroup} from '@angular/forms';
import {FormBuilder, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
})
export class SourceComponent {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  formBuilder = inject(FormBuilder);
  form = computed(() => this.formBuilder.group({
    abbr: this.source().abbr?.value,
    title: this.source().title?.value,
    text: this.source().text?.value,
    repositories: this.formBuilder.array([
      this.formBuilder.group({
        repositoryXref: 'abc',
        callNumber: 'def',
      }),
    ]),
  }));

  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    const newSource = this.source()
        .updateAbbr(this.form().value.abbr || null)
        .updateText(this.form().value.text || null)
        .updateTitle(this.form().value.title || null);
    this.ancestryService.records.update((records) => records.set(newSource.xref, newSource));
    this.editDialog().nativeElement.close();
  }

  addRepositoryToForm() {
    this.form().controls.repositories.push(this.formBuilder.group({
      repositoryXref: 'pushed',
      callNumber: '',
    }));
    // this.sourceForm.controls.repositories.push(this.formBuilder.control({
    //   repositoryXref: '',
    //   callNumber: '',
    // }));
  }
}
