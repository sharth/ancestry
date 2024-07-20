import {computed} from '@angular/core';
import {ancestryService} from '../app/ancestry.service';
import {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomFamily {
  constructor(private record: GedcomRecord) {
    if (record.abstag !== 'FAM') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'CHIL':
          this.parseFamilyChild(childRecord);
          break;
        case 'HUSB':
          this.parseFamilyHusband(childRecord);
          break;
        case 'WIFE':
          this.parseFamilyWife(childRecord);
          break;
        case 'DIV':
        case 'EVEN':
        case 'MARR':
        case 'MARB':
          this.events.push(new GedcomEvent(childRecord));
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseFamilyChild(gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.CHIL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const childXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.childOfFamilyXref = gedcomFamily.xref;
    this.childXrefs.push(childXref);

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseFamilyHusband( gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.HUSB') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const husbandXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    this.husbandXref = husbandXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseFamilyWife( gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.WIFE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const wifeXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    this.wifeXref = wifeXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  xref: string;
  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[] = [];
  events: GedcomEvent[] = [];

  get parentXrefs(): string[] {
    return [this.husbandXref, this.wifeXref].filter((e) => e != null);
  }

  husband = computed(() => {
    if (this.husbandXref) {
      return ancestryService.individual(this.husbandXref);
    } else {
      return undefined;
    }
  });

  wife = computed(() => {
    if (this.wifeXref) {
      return ancestryService.individual(this.wifeXref);
    } else {
      return undefined;
    }
  });

  parents = computed(() => this.parentXrefs
      .map((xref) => ancestryService.individual(xref)));

  children = computed(() => this.childXrefs
      .map((xref) => ancestryService.individual(xref)));

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};
