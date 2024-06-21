import {computed} from '@angular/core';
import type {AncestryService} from '../app/ancestry.service';
import {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';
import type {GedcomFamily} from './gedcomFamily';
import {GedcomCitation} from './gedcomCitation';

export class GedcomIndividual {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.abstag !== 'INDI') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
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
          this.events.push(new GedcomEvent(childRecord, ancestryService));
          break;
        case 'NAME':
          this.parseIndividualName(this, childRecord);
          break;
        case 'SEX':
          this.parseIndividualSex(this, childRecord);
          break;
        case 'FAMS': break; // Let's just use the links inside the Family record.
        case 'FAMC': break; // Let's just use the links inside the Family record.
        case '_FSFTID':
          this.familySearchId = this.parseIndividualFamilySearchId(childRecord);
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseIndividualFamilySearchId(
      gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
  }

  private parseIndividualName(
      gedcomIndividual: GedcomIndividual,
      gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.NAME') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    // if (gedcomRecord.value != null) throw new Error();

    const gedcomEvent = new GedcomEvent(gedcomRecord, this.ancestryService);
    gedcomIndividual.events.push(gedcomEvent);
    gedcomEvent.value = gedcomRecord.value;

    if (gedcomIndividual.name == null) {
      gedcomIndividual.name = gedcomRecord.value;
      gedcomIndividual.surname = gedcomRecord.value?.match('/(.*)/')?.[1];
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'SOUR':
          gedcomEvent.citations.push(new GedcomCitation(childRecord, this.ancestryService));
          break;
        default:
          this.ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseIndividualSex(
      gedcomIndividual: GedcomIndividual,
      gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const gedcomEvent = new GedcomEvent(gedcomRecord, this.ancestryService);
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
          this.ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  xref: string;
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

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};
