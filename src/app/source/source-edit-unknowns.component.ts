import {Component, model} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import type {GedcomRecord} from '../../gedcom/gedcomRecord';

@Component({
  selector: 'app-source-edit-unknowns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-unknowns.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditUnknownsComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = model.required<{unknowns: GedcomRecord[]}>();

  remove(index: number) {
    this.sourceModel.update((model) => ({
      ...model,
      unknowns: model.unknowns.toSpliced(index, 1),
    }));
  }
}
