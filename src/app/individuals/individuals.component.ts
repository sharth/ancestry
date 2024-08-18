import {Component} from '@angular/core';
import {CommonModule, KeyValuePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import { ancestryDatabase } from '../../database/ancestry.database';

@Component({
  selector: 'app-individuals',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe],
  templateUrl: './individuals.component.html',
  styleUrl: './individuals.component.css',
})
export class IndividualsComponent {
  readonly vm$ = rxjs.from(dexie.liveQuery(() => ancestryDatabase.individuals.toArray())).pipe(
    rxjs.map((individuals) => ({
      individuals: individuals,
      individualsBySurname: Array.from(Map.groupBy(individuals, (individual) => individual.surname).entries())
        .map(([surname, individuals]) => ({surname, individuals}))
        .map(({surname, individuals}) => ({
          surname,
          individuals: individuals.sort((lhs, rhs) => (lhs.name ?? '').localeCompare(rhs.name ?? ''))
        }))
        .sort((lhs, rhs) => (lhs.surname ?? '').localeCompare(rhs.surname ?? '')),
      })),
  )
}
