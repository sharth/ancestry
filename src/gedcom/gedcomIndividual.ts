import {computed} from '@angular/core';
import type {AncestryService} from '../app/ancestry.service';
import {GedcomEvent, parseEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';
import type {GedcomFamily} from './gedcomFamily';
import {parseCitation} from './gedcomCitation';

export class GedcomIndividual {
  constructor(
    public xref: string,
    public gedcomRecord: GedcomRecord,
    private ancestryService: AncestryService) { }

  events: GedcomEvent[] = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;

  readonly childOfFamilies = computed<GedcomFamily[]>(() => {
    return Array.from(this.ancestryService.families().values())
        .filter((family) => family.childXrefs.includes(this.xref));
  });

  readonly parentOfFamilies = computed<GedcomFamily[]>(() => {
    return Array.from(this.ancestryService.families().values())
        .filter((family) => family.parentXrefs.includes(this.xref));
  });

  readonly parents = computed<GedcomIndividual[]>(() => {
    //  TODO: Need to unique this.
    return this.childOfFamilies()
        .flatMap((family) => family.parents());
  });

  readonly siblings = computed<GedcomIndividual[]>(() => {
    return this.childOfFamilies()
        .flatMap((family) => family.children())
        .filter((child) => child !== this);
  });

  readonly spouses = computed<GedcomIndividual[]>(() => {
    return this.parentOfFamilies()
        .flatMap((family) => family.parents())
        .filter((parent) => parent !== this);
  });

  readonly children = computed<GedcomIndividual[]>(() => {
    return this.parentOfFamilies()
        .flatMap((family) => family.children());
  });

  readonly stepparents = computed<GedcomIndividual[]>(() => {
    return this.parents()
        .flatMap((parent)=> parent.spouses())
        .filter((stepparent) => !this.parents().includes(stepparent));
  });

  readonly stepsiblings = computed<GedcomIndividual[]>(() => {
    return this.parents()
        .flatMap((parent) => parent.children())
        .filter((stepsibling) => stepsibling !== this)
        .filter((stepsibling) => !this.siblings().includes(stepsibling));
  });

  readonly censusEvents = computed<GedcomEvent[]>(() => {
    return this.events.filter((gedcomEvent) => gedcomEvent.type === 'Census');
  });
};

export function parseIndividual(
    gedcomRecord: GedcomRecord,
    ancestryService: AncestryService,
    reportUnparsedRecord: (record:GedcomRecord) => void): GedcomIndividual {
  if (gedcomRecord.abstag !== 'INDI') throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const xref = gedcomRecord.xref;
  const gedcomIndividual = new GedcomIndividual(xref, gedcomRecord, ancestryService);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'BAPM':
      case 'BIRT':
      case 'BURI':
      case 'CENS':
      case 'DEAT':
      case 'EDUC':
      case 'EMIG':
      case 'EVEN':
      case 'IMMI':
      case 'MARB':
      case 'MARR':
      case 'NATU':
      case 'OCCU':
      case 'PROB':
      case 'RELI':
      case 'RESI':
      case 'RETI':
      case 'WILL':
      case 'DIV':
      case 'SSN':
        parseEvent(gedcomIndividual, childRecord, reportUnparsedRecord);
        break;
      case 'NAME':
        parseIndividualName(gedcomIndividual, childRecord, reportUnparsedRecord);
        break;
      case 'SEX':
        parseIndividualSex(gedcomIndividual, childRecord, reportUnparsedRecord);
        break;
      case 'FAMS': break; // Let's just use the links inside the Family record.
      case 'FAMC': break; // Let's just use the links inside the Family record.
      case '_FSFTID':
        parseIndividualFamilySearchId(gedcomIndividual, childRecord, reportUnparsedRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomIndividual;
}

function parseIndividualFamilySearchId(
    gedcomIndividual: GedcomIndividual,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record:GedcomRecord) => void): void {
  if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomIndividual.familySearchId ??= gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseIndividualName(
    gedcomIndividual: GedcomIndividual,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record:GedcomRecord) => void): void {
  if (gedcomRecord.abstag !== 'INDI.NAME') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  // if (gedcomRecord.value != null) throw new Error();

  const gedcomEvent = new GedcomEvent('Name', gedcomRecord);
  gedcomIndividual.events.push(gedcomEvent);
  gedcomEvent.value = gedcomRecord.value;

  if (gedcomIndividual.name == null) {
    gedcomIndividual.name = gedcomRecord.value;
    gedcomIndividual.surname = gedcomRecord.value?.match('/(.*)/')?.[1];
  }

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'SOUR':
        gedcomEvent.citations.push(parseCitation(childRecord, reportUnparsedRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseIndividualSex(
    gedcomIndividual: GedcomIndividual,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record:GedcomRecord) => void): void {
  if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomEvent = new GedcomEvent('Sex', gedcomRecord);
  gedcomIndividual.events.push(gedcomEvent);
  gedcomEvent.value = gedcomRecord.value;

  if (gedcomIndividual.sex == null) {
    switch (gedcomRecord.value) {
      case 'M':
        gedcomIndividual.sex = 'Male';
        break;
      case 'F':
        gedcomIndividual.sex = 'Female';
        break;
    }
  }

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}
