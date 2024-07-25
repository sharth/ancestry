import {Component, model} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-edit-repository-citations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './source-edit-repository-citations.component.html',
  styleUrl: './source.component.css',
})
export class SourceEditRepositoryCitationsComponent {
  readonly ancestryService = ancestryService;
  readonly sourceModel = model.required<GedcomSource>();

  append() {
    this.sourceModel().repositoryCitations.push({
      repositoryXref: '',
      callNumbers: [''],
    });
  }

  remove(index: number) {
    this.sourceModel().repositoryCitations.splice(index, 1);
  }
}
