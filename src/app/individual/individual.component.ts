import {Component, computed, input} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import type {GedcomEvent} from '../../gedcom/gedcomEvent';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';
import {serializeGedcomIndividualToGedcomRecord} from '../../gedcom/gedcomIndividual.serializer';
import {serializeGedcomEventToGedcomRecord} from '../../gedcom/gedcomEvent.serializer';
import {combineLatest, map} from 'rxjs';
import {liveQuery} from 'dexie';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ancestryDatabase} from '../../database/ancestry.database';

@Component({
  selector: 'app-individual',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './individual.component.html',
  styleUrl: './individual.component.css',
})
export class IndividualComponent {
  readonly ancestryService = ancestryService;
  readonly xref = input.required<string>();

  readonly vm$ = toSignal(combineLatest([
    toObservable(this.xref),
    liveQuery(() => ancestryDatabase.individuals.toArray()),
    liveQuery(() => ancestryDatabase.families.toArray()),
  ]).pipe(
      map(([xref, individuals, families]) => ({xref, individuals, families})),
      map(({xref, individuals, families}) => {
        const individual = individuals.find((individual) => individual.xref == xref);
        if (individual == null) return null;

        const parents = families
            .filter((family) => family.childXrefs.includes(xref))
            .flatMap((family) => [family.husbandXref, family.wifeXref])
            .filter((parentXref) => parentXref != null)
            .map((parentXref) => individuals.find((parent) => parent.xref == parentXref))
            .filter((parent) => parent != null);
        const siblings = families
            .filter((family) => family.childXrefs.includes(xref))
            .flatMap((family) => family.childXrefs)
            .filter((siblingXref) => xref != siblingXref)
            .map((siblingXref) => individuals.find((sibling) => sibling.xref == siblingXref))
            .filter((sibling) => sibling != null);
        const spouses = families
            .filter((family) => family.husbandXref == xref || family.wifeXref == xref)
            .flatMap((family) => [family.husbandXref, family.wifeXref])
            .filter((spouseXref) => spouseXref != null)
            .filter((spouseXref) => spouseXref != xref)
            .map((spouseXref) => individuals.find((spouse) => spouseXref == spouse.xref))
            .filter((spouse) => spouse != null);
        const children = families
            .filter((family) => family.husbandXref == xref || family.wifeXref == xref)
            .flatMap((family) => family.childXrefs)
            .map((childXref) => individuals.find((child) => child.xref == childXref))
            .filter((child) => child != null);

        const ancestorXrefs: (string | undefined)[] = [undefined, xref];
        for (let i = 1; i < ancestorXrefs.length; i += 1) {
          const ancestorXref = ancestorXrefs[i];
          if (ancestorXref) {
            const family = families.find((family) => family.childXrefs.includes(ancestorXref));
            ancestorXrefs[2*i + 0] = family?.husbandXref;
            ancestorXrefs[2*i + 1] = family?.wifeXref;
          }
        }
        const ancestors = ancestorXrefs
            .map((ancestorXref) => individuals.find((individual) => individual.xref == ancestorXref));

        return {
          individual,
          ancestors,
          parents,
          siblings,
          spouses,
          children,
          gedcom: serializeGedcomRecordToText(
              serializeGedcomIndividualToGedcomRecord(individual)),
        };
      }),
  ));

  readonly individual = computed(() => this.ancestryService.individual(this.xref()));

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;

  gedcom(): string {
    return serializeGedcomRecordToText(
        serializeGedcomIndividualToGedcomRecord(this.individual()));
  }

  serializeGedcomEventToText(gedcomEvent: GedcomEvent): string {
    return serializeGedcomRecordToText(
        serializeGedcomEventToGedcomRecord(gedcomEvent));
  }

  // ancestors = computed<(GedcomIndividual | undefined)[]>(() => {
  //   const ancestors: (GedcomIndividual | undefined)[] = [];
  //   ancestors[1] = this.individual();
  //   for (let i = 1; i < ancestors.length; i += 1) {
  //     if (ancestors[i] != null) {
  //       const family = ancestors[i]?.childOfFamilies()?.[0];
  //       ancestors[2*i + 0] = family?.husband();
  //       ancestors[2*i + 1] = family?.wife();
  //     }
  //   }
  //   return ancestors;
  // });

  // relatives = computed<{ relationship: string, individual: GedcomIndividual }[]>(() => {
  //   const relatives = [];


  //   // Stepsiblings
  //   relatives.push(...this.individual().stepsiblings() .map((stepsibling) => ({
  //     // eslint-disable-next-line max-len
  //     relationship: stepsibling.sex === 'Male' ? 'Stepbrother' : stepsibling.sex === 'Female' ? 'Stepsister' : 'Stepsibling',
  //     individual: stepsibling,
  //   })));

  //   // Spouses
  //   relatives.push(...this.individual().spouses().map((spouse) =>({
  //     relationship: spouse.sex === 'Male' ? 'Husband' : spouse.sex === 'Female' ? 'Wife' : 'Spouse',
  //     individual: spouse,
  //   })));

  //   // Children
  //   relatives.push(...this.individual().children().map((child) => ({
  //     relationship: child.sex === 'Male' ? 'Son' : child.sex === 'Female' ? 'Daughter' : 'Child',
  //     individual: child,
  //   })));

  //   return relatives;
  // });

  // censusTable = computed(() => {
  //   const yearSet = new Set<string>();
  //   for (const ancestor of this.ancestors()) {
  //     if (ancestor != null) {
  //       for (const event of ancestor.censusEvents()) {
  //         if (event.date != null) {
  //           yearSet.add(event.date);
  //         }
  //       }
  //     }
  //   }
  //   const dates = [...yearSet].sort();
  //   const dateToColumn = new Map<string, number>();
  //   for (const date of dates) {
  //     dateToColumn.set(date, dateToColumn.size);
  //   }
  //   const rows = [];
  //   for (const ancestor of this.ancestors()) {
  //     if (ancestor != null) {
  //       const row = {
  //         ancestor,
  //         censuses: new Array<GedcomEvent | undefined>(dateToColumn.size),
  //       };
  //       rows.push(row);
  //       for (const event of ancestor.censusEvents()) {
  //         if (event.date != null) {
  //           const column = dateToColumn.get(event.date);
  //           if (column == null) throw new Error();
  //           row.censuses[column] = event;
  //         }
  //       }
  //     }
  //   }
  //   return {
  //     header: dates,
  //     rows,
  //   };
  // });

  private readonly showEventGedcomMap = new Map<GedcomEvent, boolean>();
  toggleGedcom(event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false;
    this.showEventGedcomMap.set(event, !status);
  }

  showGedcom(event: GedcomEvent): boolean {
    return this.showEventGedcomMap.get(event) ?? false;
  }
}
