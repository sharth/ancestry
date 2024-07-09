import {Component, inject, model} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import type {SourceModel} from './source-model';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-source-edit-abbr',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-abbr.component.html',
  styleUrls: ['./source.component.css'],
})
export class SourceEditAbbrComponent {
  readonly ancestryService = inject(AncestryService);
  readonly sourceModel = model.required<SourceModel>();
}
