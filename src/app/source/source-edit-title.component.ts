import {Component, input} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-edit-title',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-title.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditTitleComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = input.required<GedcomSource>();
}
