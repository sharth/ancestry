import {computed} from '@angular/core';
import type {AncestryService} from '../app/ancestry.service';
import {parseEvent, type GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomFamily {
  constructor(
    public xref: string,
    public gedcomRecord: GedcomRecord,
    private ancestryService: AncestryService) { }

  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[] = [];
  events: GedcomEvent[] = [];

  get parentXrefs(): string[] {
    return [this.husbandXref, this.wifeXref].filter((e): e is NonNullable<typeof e> => e != null);
  }

  husband = computed(() => {
    if (this.husbandXref) {
      return this.ancestryService.individual(this.husbandXref);
    } else {
      return undefined;
    }
  });

  wife = computed(() => {
    if (this.wifeXref) {
      return this.ancestryService.individual(this.wifeXref);
    } else {
      return undefined;
    }
  });

  parents = computed(() => this.parentXrefs
      .map((xref) => this.ancestryService.individual(xref)));

  children = computed(() => this.childXrefs
      .map((xref) => this.ancestryService.individual(xref)));
};

export function parseFamily(
    gedcomRecord: GedcomRecord,
    ancestryService: AncestryService,
    reportUnparsedRecord: (record: GedcomRecord)=>void): GedcomFamily {
  if (gedcomRecord.abstag !== 'FAM') throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const xref = gedcomRecord.xref;
  const gedcomFamily = new GedcomFamily(xref, gedcomRecord, ancestryService);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'CHIL':
        parseFamilyChild(gedcomFamily, childRecord, reportUnparsedRecord);
        break;
      case 'HUSB':
        parseFamilyHusband(gedcomFamily, childRecord, reportUnparsedRecord);
        break;
      case 'WIFE':
        parseFamilyWife(gedcomFamily, childRecord, reportUnparsedRecord);
        break;
      case 'DIV':
      case 'EVEN':
      case 'MARR':
      case 'MARB':
        gedcomFamily.events.push(parseEvent(childRecord, reportUnparsedRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

function parseFamilyChild(
    gedcomFamily: GedcomFamily,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=>void): void {
  if (gedcomRecord.abstag !== 'FAM.CHIL') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const childXref = gedcomRecord.value;
  // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
  // individual.childOfFamilyXref = gedcomFamily.xref;
  gedcomFamily.childXrefs.push(childXref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function
parseFamilyHusband(
    gedcomFamily: GedcomFamily,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=>void): void {
  if (gedcomRecord.abstag !== 'FAM.HUSB') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const husbandXref = gedcomRecord.value;
  // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
  // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
  gedcomFamily.husbandXref = husbandXref;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseFamilyWife(
    gedcomFamily: GedcomFamily,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=>void): void {
  if (gedcomRecord.abstag !== 'FAM.WIFE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const wifeXref = gedcomRecord.value;
  // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
  // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
  gedcomFamily.wifeXref = wifeXref;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}
