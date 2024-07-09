import {Component, inject, model} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source-edit-repositories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-repositories.component.html',
  styleUrls: ['./source.component.css'],
})
export class SourceEditRepositoriesComponent {
  readonly ancestryService = inject(AncestryService);
  readonly sourceModel = model.required<{repositories: {repositoryXref: string, callNumber: string}[]}>();

  addSourceRepository() {
    this.sourceModel.update((model) => ({
      ...model,
      repositories: [
        ...model.repositories,
        {repositoryXref: '', callNumber: ''},
      ],
    }));
  }
}