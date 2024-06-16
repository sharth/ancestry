import {Component, computed, inject, input} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import type {GedcomEvent} from '../../gedcom/gedcomEvent';
import type {GedcomIndividual} from '../../gedcom/gedcomIndividual';

@Component({
  selector: 'app-individual',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './individual.component.html',
  styleUrl: './individual.component.css',
})
export class IndividualComponent {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  individual = computed(() => this.ancestryService.individual(this.xref()));

  ancestors = computed<(GedcomIndividual | undefined)[]>(() => {
    const ancestors: (GedcomIndividual | undefined)[] = [];
    ancestors[1] = this.individual();
    for (let i = 1; i < ancestors.length; i += 1) {
      if (ancestors[i] != null) {
        const familyXref = ancestors[i]?.childOfFamilyXref;
        const family = familyXref ? this.ancestryService.family(familyXref) : undefined;
        const husband = family?.husbandXref ? this.ancestryService.individual(family?.husbandXref) : undefined;
        const wife = family?.wifeXref ? this.ancestryService.individual(family?.wifeXref) : undefined;
        ancestors[2 * i + 0] = husband;
        ancestors[2 * i + 1] = wife;
      }
    }
    return ancestors;
  });

  relatives = computed<{ relationship: string, individual: GedcomIndividual }[]>(() => {
    const relatives = [];

    const familyXref = this.individual().childOfFamilyXref;
    const family = familyXref ? this.ancestryService.family(familyXref) : undefined;
    const stepfamilies = (family?.parentXrefs() ?? [])
        .map((parentXref) => this.ancestryService.individual(parentXref))
        .flatMap((parent) => parent.parentOfFamilyXrefs)
        .map((xref) => this.ancestryService.family(xref))
        .filter((stepfamily) => stepfamily !== family);

    // Parents
    relatives.push(...(family?.parentXrefs() ?? [])
        .map((parentXref) => this.ancestryService.individual(parentXref))
        .map((parent) => ({
          relationship: parent.sex === 'Male' ? 'Father' : parent.sex === 'Female' ? 'Mother' : 'Parent',
          individual: parent,
        })));

    // Siblings
    relatives.push(...(family?.childXrefs ?? [])
        .map((childXref) => this.ancestryService.individual(childXref))
        .filter((sibling) => sibling !== this.individual())
        .map((sibling) => ({
          relationship: sibling.sex === 'Male' ? 'Brother' : sibling.sex === 'Female' ? 'Sister' : 'Sibling',
          individual: sibling,
        })));

    // Stepparents
    relatives.push(...stepfamilies
        .flatMap((stepfamily) => stepfamily.parentXrefs())
        .filter((stepparentXref) => stepparentXref != family?.husbandXref)
        .filter((stepparentXref) => stepparentXref != family?.wifeXref)
        .map((stepparentXref) => this.ancestryService.individual(stepparentXref))
        .map((stepparent) => ({
          relationship: stepparent.sex === 'Male' ? 'Stepfather' : stepparent.sex === 'Female' ? 'Stepmother' : 'Stepparent',
          individual: stepparent,
        })));

    // Stepsiblings
    relatives.push(...stepfamilies
        .flatMap((stepfamily) => stepfamily.childXrefs)
        .map((childXref) => this.ancestryService.individual(childXref))
        .map((stepsibling) => ({
          relationship: stepsibling.sex === 'Male' ? 'Stepbrother' : stepsibling.sex === 'Female' ? 'Stepsister' : 'Stepsibling',
          individual: stepsibling,
        })));

    // Spouses
    relatives.push(...this.individual().parentOfFamilyXrefs
        .map((xref) => this.ancestryService.family(xref))
        .flatMap((family) => family.parentXrefs())
        .map((parentXref) => (this.ancestryService.individual(parentXref)))
        .filter((parent) => parent !== this.individual())
        .map((spouse) =>({
          relationship: spouse.sex === 'Male' ? 'Husband' : spouse.sex === 'Female' ? 'Wife' : 'Spouse',
          individual: spouse,
        })));

    // Children
    relatives.push(...this.individual().parentOfFamilyXrefs
        .map((familyXref) => this.ancestryService.family(familyXref))
        .flatMap((family) => family.childXrefs)
        .map((childXref) => this.ancestryService.individual(childXref))
        .map((child) => ({
          relationship: child.sex === 'Male' ? 'Son' : child.sex === 'Female' ? 'Daughter' : 'Child',
          individual: child,
        })));

    return relatives;
  });

  censusTable = computed(() => {
    const yearSet = new Set<string>();
    for (const ancestor of this.ancestors()) {
      if (ancestor != null) {
        for (const event of ancestor.censusEvents()) {
          if (event.date != null) {
            yearSet.add(event.date);
          }
        }
      }
    }
    const dates = [...yearSet].sort();
    const dateToColumn = new Map<string, number>();
    for (const date of dates) {
      dateToColumn.set(date, dateToColumn.size);
    }
    const rows = [];
    for (const ancestor of this.ancestors()) {
      if (ancestor != null) {
        const row = {
          ancestor,
          censuses: new Array<GedcomEvent | undefined>(dateToColumn.size),
        };
        rows.push(row);
        for (const event of ancestor.censusEvents()) {
          if (event.date != null) {
            const column = dateToColumn.get(event.date);
            if (column == null) throw new Error();
            row.censuses[column] = event;
          }
        }
      }
    }
    return {
      header: dates,
      rows,
    };
  });

  private readonly showEventGedcomMap = new Map<GedcomEvent, boolean>();
  toggleGedcom(event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false;
    console.log('toggleGedcom', !status, event);
    this.showEventGedcomMap.set(event, !status);
  }

  showGedcom(event: GedcomEvent): boolean {
    console.log('showGedcom', (this.showEventGedcomMap.get(event) ?? false), event);
    return this.showEventGedcomMap.get(event) ?? false;
  }
}
