import {Component, computed, inject, input} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {GedcomCitation} from '../../gedcom/gedcomCitation';
import {GedcomEvent} from '../../gedcom/gedcomEvent';
import {GedcomIndividual} from '../../gedcom/gedcomIndividual';

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

  citations(): { individual: GedcomIndividual; event: GedcomEvent; citation: GedcomCitation; }[] {
    const arr = [];
    for (const individual of this.ancestryService.individuals()) {
      for (const event of individual.events) {
        for (const citation of event.citations) {
          if (citation.source == this.source()) {
            arr.push({individual: individual, event: event, citation: citation});
          }
        }
      }
    }
    return arr;
  }
}

// individualsBySurname(): Map<string | undefined, GedcomIndividual[]> {
//   const surnameMap = new Map<string, GedcomIndividual[]>()
//   for (const individual of this.ancestryService.individuals()) {
//     let surnames = surnameMap.get(individual.surname ?? '')
//     if (surnames == null) surnameMap.set(individual.surname ?? '', surnames = [])
//     surnames.push(individual)
//   }
//   return surnameMap
// }

