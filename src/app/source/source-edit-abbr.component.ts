import {Component, model} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-edit-abbr',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-abbr.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditAbbrComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = model.required<GedcomSource>();
}
