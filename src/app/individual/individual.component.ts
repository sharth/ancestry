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

  relatives: Signal<Array<{ relationship: string, individual: GedcomIndividual }>> = computed(() => {
    const relatives = []

    // Parents and Siblings
    const family = this.individual().childOfFamily
    if (family?.husband != null) { relatives.push({ relationship: 'Father', individual: family.husband }) }
    if (family?.wife != null) { relatives.push({ relationship: 'Mother', individual: family.wife }) }
    if (family?.children != null) {
      relatives.push(...family.children
        .filter(sibling => sibling !== this.individual())
        .map(sibling => ({
          relationship: sibling.sex === 'Male' ? 'Brother' : sibling.sex === 'Female' ? 'Sister' : 'Sibling',
          individual: sibling
        })))
    }

    // Stepparents and Stepsiblings
    for (const parent of family?.parents() ?? []) {
      for (const stepfamily of parent.parentOfFamilies) {
        if (stepfamily !== family) {
          if ((stepfamily.husband != null) && stepfamily.husband !== family?.husband) { relatives.push({ relationship: 'Stepfather', individual: stepfamily.husband }) }
          if ((stepfamily.wife != null) && stepfamily.wife !== family?.wife) { relatives.push({ relationship: 'Stepmother', individual: stepfamily.wife }) }
          relatives.push(...stepfamily.children
            .map(stepsibling => ({
              relationship: stepsibling.sex === 'Male' ? 'Stepbrother' : stepsibling.sex === 'Female' ? 'Stepsister' : 'Stepsibling',
              individual: stepsibling
            })))
        }
      }
    }

    // Spouse and children
    for (const family of this.individual().parentOfFamilies) {
      if (family.husband != null && family.husband !== this.individual()) { relatives.push({ relationship: 'Husband', individual: family.husband }) }
      if (family.wife != null && family.wife !== this.individual()) { relatives.push({ relationship: 'Wife', individual: family.wife }) }
      relatives.push(...family.children
        .map(child => ({
          relationship: child.sex === 'Male' ? 'Son' : child.sex === 'Female' ? 'Daughter' : 'Child',
          individual: child
        })))
    }

    return relatives
  })

  ancestors: Signal<Array<GedcomIndividual | undefined>> = computed(() => {
    const ancestors = new Array<GedcomIndividual | undefined>()
    ancestors[1] = this.individual()
    for (let i = 1; i < ancestors.length; i += 1) {
      if (ancestors[i] != null) {
        ancestors[2 * i + 0] = ancestors[i]?.childOfFamily?.husband
        ancestors[2 * i + 1] = ancestors[i]?.childOfFamily?.wife
      }
    }
    return ancestors
  })

  censusTable = computed(() => {
    const yearSet = new Set<string>()
    for (const ancestor of this.ancestors()) {
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
    for (const ancestor of this.ancestors()) {
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
  toggleGedcom (event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false
    console.log('toggleGedcom', !status, event)
    this.showEventGedcomMap.set(event, !status)
  }

  showGedcom (event: GedcomEvent): boolean {
    console.log('showGedcom', (this.showEventGedcomMap.get(event) ?? false), event)
    return this.showEventGedcomMap.get(event) ?? false
  }
}
