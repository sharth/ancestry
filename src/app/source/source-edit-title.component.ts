import {Component, inject, model} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-source-edit-title',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './source-edit-title.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditTitleComponent {
  readonly ancestryService = inject(AncestryService);
  readonly sourceModel = model.required<{title: string}>();
}
