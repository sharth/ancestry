import {Component, model} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source-edit-repositories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-repositories.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditRepositoriesComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = model.required<{repositories: {repositoryXref: string, callNumber: string}[]}>();

  append() {
    this.sourceModel.update((model) => ({
      ...model,
      repositories: [
        ...model.repositories,
        {repositoryXref: '', callNumber: ''},
      ],
    }));
  }

  remove(index: number) {
    this.sourceModel.update((model) => ({
      ...model,
      repositories: model.repositories.toSpliced(index, 1),
    }));
  }
}
