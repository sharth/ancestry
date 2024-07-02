import {Component, computed, inject, input, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
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

  sourceForm = new FormGroup({
    abbr: new FormControl(''),
    title: new FormControl(''),
    text: new FormControl(''),
  });

  onSubmit() {
    const source = this.source();
    const sourceForm = this.sourceForm;
    console.log(this.sourceForm.value);
    this.ancestryService.records.update((records) => records.set(source.xref, source
        .updateAbbr(sourceForm.value.abbr || null)));
  }
}
