import {Component, computed} from '@angular/core';
import {CommonModule, KeyValuePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ancestryService} from '../ancestry.service';

@Component({
  selector: 'app-individuals',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe],
  templateUrl: './individuals.component.html',
  styleUrl: './individuals.component.css',
})
export class IndividualsComponent {
  readonly ancestryService = ancestryService;

  readonly individuals = computed(() =>
    this.ancestryService.individuals()
        .sort((a, b) => a.xref.localeCompare(b.xref)));

  readonly individualsBySurname = computed(() =>
    this.ancestryService.individuals()
        .groupBy((individual) => individual.surname ?? '')
        .mapEntries(([surname, individuals]) =>
          [surname, individuals.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))])
        .entrySeq()
        .map((entry) => ({surname: entry[0], individuals: entry[1]}))
        .sort((a, b) => a.surname.localeCompare(b.surname)));
}
