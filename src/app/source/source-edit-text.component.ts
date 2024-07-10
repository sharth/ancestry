import {Component, inject, model} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-source-edit-text',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-text.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditTextComponent {
  readonly ancestryService = inject(AncestryService);
  readonly sourceModel = model.required<{text: string}>();
}
