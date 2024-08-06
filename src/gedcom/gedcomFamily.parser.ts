import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';
import {GedcomFamily} from './gedcomFamily';
import {parseGedcomEventFromGedcomRecord} from './gedcomEvent.parser';

export function parseGedcomFamilyFromGedcomRecord(record: GedcomRecord): GedcomFamily {
  if (record.abstag !== 'FAM') throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomFamily = new GedcomFamily(record.xref);
  gedcomFamily.gedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case 'CHIL':
        parseFamilyChild(gedcomFamily, childRecord);
        break;
      case 'HUSB':
        parseFamilyHusband(gedcomFamily, childRecord);
        break;
      case 'WIFE':
        parseFamilyWife(gedcomFamily, childRecord);
        break;
      case 'DIV':
      case 'EVEN':
      case 'MARR':
      case 'MARB':
        gedcomFamily.events.push(parseGedcomEventFromGedcomRecord(childRecord));
        break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

function parseFamilyChild(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
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
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseFamilyHusband(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
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
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseFamilyWife(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
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
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }
}
