import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import {CommonModule} from '@angular/common';
import {ancestryService} from '../ancestry.service';
import type {GedcomRepository} from '../../gedcom/gedcomRepository';

@Component({
  selector: 'app-source-view-repository-citations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-view-repository-citations.component.html',
  styleUrl: './source.component.css',
})
export class SourceViewRepositoryCitationsComponent {
  readonly ancestryService = ancestryService;
  readonly source = input.required<GedcomSource>();

  lookupRepository(repositoryXref?: string): GedcomRepository | undefined {
    if (repositoryXref == undefined) {
      return undefined;
    } else {
      return ancestryService.repository(repositoryXref);
    }
  }
}
