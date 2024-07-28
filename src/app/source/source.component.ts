import type {ElementRef} from '@angular/core';
import {Component, computed, input, viewChild} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoryCitationsComponent} from './source-edit-repository-citations.component';
import {SourceEditUnknownsComponent} from './source-edit-unknowns.component';
import {serializeSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import type {GedcomRepository} from '../../gedcom/gedcomRepository';

@Component({
  selector: 'app-source',
  standalone: true,
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SourceEditAbbrComponent,
    SourceEditTitleComponent,
    SourceEditTextComponent,
    SourceEditRepositoryCitationsComponent,
    SourceEditUnknownsComponent,
  ],
})
export class SourceComponent {
  readonly ancestryService = ancestryService;
  readonly xref = input.required<string>();
  readonly source = computed(() => this.ancestryService.source(this.xref()));
  readonly gedcomRecord = computed(() => serializeSourceToGedcomRecord(this.source()));

  readonly vm = computed(() => {
    const source = this.ancestryService.sources().find((source) => source.xref == this.xref());
    const individuals = this.ancestryService.individuals();
    const repositories = this.ancestryService.repositories();
    if (source == undefined) {
      return undefined;
    }
    return {
      xref: this.xref(),
      abbr: source.abbr ?? this.xref(),
      title: source.title,
      text: source.text,
      citations: individuals
          .flatMap((individual) => individual.events.map((event) => ({individual, event})))
          .flatMap(({individual, event}) => event.citations.map((citation) => ({individual, event, citation})))
          .filter(({citation}) => citation.sourceXref == this.xref()),
      repositoryCitations: source.repositoryCitations.map((repositoryCitation) => ({
        repositoryXref: repositoryCitation.repositoryXref,
        callNumbers: repositoryCitation.callNumbers,
        repository: repositories.find((repository) => repository.xref == repositoryCitation.repositoryXref),
      })),
      unknownRecords: this.source().unknownRecords,
      gedcom: serializeSourceToGedcomRecord(source),
    };
  });

  lookupRepository(repositoryXref?: string): GedcomRepository | undefined {
    if (repositoryXref == undefined) {
      return undefined;
    } else {
      return ancestryService.repository(repositoryXref);
    }
  }

  model?: GedcomSource;
  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.model = this.source().clone();
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    this.ancestryService.records.update((records) => records.set(this.xref(), this.model!));
    this.editDialog().nativeElement.close();
  }
}
