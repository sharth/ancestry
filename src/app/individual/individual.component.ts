import { Component, type Signal, computed, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { type GedcomIndividual, type GedcomEvent } from '../../gedcom'

@Component({
  selector: 'app-individual',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './individual.component.html',
  styleUrl: './individual.component.css'
})
export class IndividualComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
  individual = computed(() => this.ancestryService.individual(this.xref()))

  censusTable = computed(() => {
    const yearSet = new Set<string>()
    for (const ancestor of this.individual().ancestors()) {
      if (ancestor != null) {
        for (const event of ancestor.censusEvents()) {
          if (event.date != null) {
            yearSet.add(event.date)
          }
        }
      }
    }
    const dates = [...yearSet].sort()
    const dateToColumn = new Map<string, number>()
    for (const date of dates) {
      dateToColumn.set(date, dateToColumn.size)
    }
    const rows = []
    for (const ancestor of this.individual().ancestors()) {
      if (ancestor != null) {
        const row = {
          ancestor,
          censuses: new Array<GedcomEvent | undefined>(dateToColumn.size)
        }
        rows.push(row)
        for (const event of ancestor.censusEvents()) {
          if (event.date != null) {
            const column = dateToColumn.get(event.date)
            if (column == null) throw new Error()
            row.censuses[column] = event
          }
        }
      }
    }
    return {
      header: dates,
      rows
    }
  })

  private readonly showEventGedcomMap = new Map<GedcomEvent, boolean>()
  toggleGedcom(event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false
    console.log('toggleGedcom', !status, event)
    this.showEventGedcomMap.set(event, !status)
  }

  showGedcom(event: GedcomEvent): boolean {
    console.log('showGedcom', (this.showEventGedcomMap.get(event) ?? false), event)
    return this.showEventGedcomMap.get(event) ?? false
  }
}
