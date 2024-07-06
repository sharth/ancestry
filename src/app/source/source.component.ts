import type {ElementRef} from '@angular/core';
import {Component, computed, inject, input, viewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
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

  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  formBuilder = inject(FormBuilder);
  sourceForm = this.formBuilder.group({
    abbr: '',
    title: '',
    text: '',
    repositories: this.formBuilder.array([
      this.formBuilder.group({
        repositoryXref: '',
        callNumber: '',
      }),
    ]),
  });

  openForm() {
    this.sourceForm.setValue({
      abbr: this.source().abbr?.value ?? '',
      title: this.source().title?.value ?? '',
      text: this.source().text?.value ?? '',
      repositories: [
        // {repositoryXref: '', callNumber: ''},
        ...this.source().repositories.flatMap((sourceRepository) =>
          sourceRepository.callNumbers.map((callNumber) => ({
            repositoryXref: sourceRepository.repositoryXref,
            callNumber: callNumber,
          }))),
      ],
    });
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    const newSource = this.source()
        .updateAbbr(this.sourceForm.value.abbr || null)
        .updateText(this.sourceForm.value.text || null)
        .updateTitle(this.sourceForm.value.title || null);
    this.ancestryService.records.update((records) => records.set(newSource.xref, newSource));
    this.editDialog().nativeElement.close();
  }

  addRepositoryToForm() {
    this.sourceForm.controls.repositories.controls.push(this.formBuilder.group({
      repositoryXref: '',
      callNumber: '',
    }));
    // this.sourceForm.controls.repositories.push(this.formBuilder.control({
    //   repositoryXref: '',
    //   callNumber: '',
    // }));
  }
}
