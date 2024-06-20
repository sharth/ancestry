import {Component, computed, inject, input} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import type {GedcomCitation} from '../../gedcom/gedcomCitation';
import type {GedcomEvent} from '../../gedcom/gedcomEvent';
import type {GedcomIndividual} from '../../gedcom/gedcomIndividual';

@Component({
  selector: 'app-source-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './source-detail.component.html',
  styleUrl: './source-detail.component.css',
})
export class SourceDetailComponent {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  citations = computed<{ individual: GedcomIndividual; event: GedcomEvent; citation: GedcomCitation; }[]>(() => {
    const arr = [];
    for (const individual of this.ancestryService.individuals().values()) {
      for (const event of individual.events) {
        for (const citation of event.citations) {
          if (citation.sourceXref == this.xref()) {
            arr.push({individual: individual, event: event, citation: citation});
          }
        }
      }
    }
    return arr;
  });
}
