import {Component, model} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-edit-unknowns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-unknowns.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditUnknownsComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = model.required<GedcomSource>();

  remove(index: number) {
    this.sourceModel().unknownRecords.splice(index, 1);
  }
}
