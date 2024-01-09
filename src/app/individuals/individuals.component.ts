import { Component, inject } from '@angular/core'
import { CommonModule, KeyValuePipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { AncestryService } from '../ancestry.service'
import { type GedcomIndividual } from '../../gedcom'

@Component({
  selector: 'app-individuals',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe],
  templateUrl: './individuals.component.html',
  styleUrl: './individuals.component.css'
})
export class IndividualsComponent {
  ancestryService = inject(AncestryService)

  individuals (): GedcomIndividual[] {
    return Array.from(this.ancestryService.individuals()).sort((a, b) => a.xref.localeCompare(b.xref))
  }

  individualsBySurname (): Map<string | undefined, GedcomIndividual[]> {
    const surnameMap = new Map<string, GedcomIndividual[]>()
    for (const individual of this.ancestryService.individuals()) {
      let surnames = surnameMap.get(individual.surname ?? '')
      if (surnames == null) surnameMap.set(individual.surname ?? '', surnames = [])
      surnames.push(individual)
    }
    return surnameMap
  }
}
