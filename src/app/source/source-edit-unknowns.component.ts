import {Component, inject, model} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import type {GedcomRecord} from '../../gedcom/gedcomRecord';

@Component({
  selector: 'app-source-edit-unknowns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-unknowns.component.html',
  styleUrls: ['./source.component.css'],
})
export class SourceEditUnknownsComponent {
  readonly ancestryService = inject(AncestryService);
  readonly sourceModel = model.required<{unknowns: GedcomRecord[]}>();

  remove(index: number) {
    this.sourceModel.update((model) => ({
      ...model,
      unknowns: model.unknowns.toSpliced(index, 1),
    }));
  }
}
