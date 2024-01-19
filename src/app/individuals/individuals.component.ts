import { Component } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router'

import { AncestryService, Individual } from '../ancestry.service';

@Component({
  selector: 'app-individuals',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe],
  templateUrl: './individuals.component.html',
  styleUrl: './individuals.component.css'
})
export class IndividualsComponent {
  constructor(private ancestryService: AncestryService) { }

  individuals() {
    return Array.from(this.ancestryService.individuals()).sort((a, b) => a.xref.localeCompare(b.xref));
  }

  individualsBySurname() {
    const surnames = new Map<string | undefined, Individual[]>();
    for (const individual of this.ancestryService.individuals()) {
      if (!surnames.has(individual.surname))
        surnames.set(individual.surname, new Array());
      surnames.get(individual.surname)!.push(individual);
    }
    return surnames;
  }
}
