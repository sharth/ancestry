import {Component, model} from '@angular/core';
import {FormsModule} from '@angular/forms';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-edit-text',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-text.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditTextComponent {
  readonly sourceModel = model.required<GedcomSource>();
}
