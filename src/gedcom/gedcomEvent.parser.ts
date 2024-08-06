import {ancestryService} from '../app/ancestry.service';
import {parseGedcomCitationFromGedcomRecord} from './gedcomCitation.parser';
import {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';

export function parseGedcomEventFromGedcomRecord(record: GedcomRecord): GedcomEvent {
  if (record.xref != null) throw new Error();

  const type = new Map([
    ['BAPM', 'Baptism'],
    ['BIRT', 'Birth'],
    ['BURI', 'Burial'],
    ['CENS', 'Census'],
    ['DEAT', 'Death'],
    ['DIV', 'Divorce'],
    ['EDUC', 'Education'],
    ['EMIG', 'Emigration'],
    ['EVEN', 'Event'],
    ['IMMI', 'Immigration'],
    ['MARB', 'Marriage Banns'],
    ['MARR', 'Marriage'],
    ['NAME', 'Name'],
    ['NATU', 'Naturalization'],
    ['OCCU', 'Occupation'],
    ['PROB', 'Probate'],
    ['RELI', 'Religion'],
    ['RESI', 'Residence'],
    ['RETI', 'Retirement'],
    ['SEX', 'Sex'],
    ['SSN', 'Social Security Number'],
    ['WILL', 'Will'],
  ]).get(record.tag) ?? record.tag;

  const gedcomEvent = new GedcomEvent(type);
  gedcomEvent.value = record.value;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case '_SHAR':
        gedcomEvent.sharedWithXrefs.push(parseEventShare(childRecord));
        break;
      case 'SOUR':
        gedcomEvent.citations.push(parseGedcomCitationFromGedcomRecord(childRecord));
        break;
      case 'DATE':
        parseEventDate(gedcomEvent, childRecord);
        break;
      case 'TYPE':
        gedcomEvent.type = parseEventType(childRecord);
        break;
      case 'ADDR':
        gedcomEvent.address = parseEventAddress(childRecord);
        break;
      case 'PLAC':
        gedcomEvent.place = parseEventPlace(childRecord);
        break;
      case 'CAUS':
        gedcomEvent.cause = parseEventCause(childRecord);
        break;
      case '_SENT': break;
      case '_SDATE': break;
      case '_PRIM': break;
      case '_PROOF': break;
      case 'NOTE': break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomEvent;
}

function parseEventAddress(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag !== 'ADDR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
  return gedcomRecord.value;
}

function parseEventPlace(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag !== 'PLAC') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
  return gedcomRecord.value;
}

function parseEventCause(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag !== 'CAUS') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
  return gedcomRecord.value;
}

function parseEventDate(gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
  if (gedcomRecord.tag !== 'DATE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.date = gedcomRecord.value;
  gedcomEvent.dateDescriptive = gedcomRecord.value.replaceAll(/\w+/g, (s: string) => {
    switch (s) {
      case 'JAN': return 'January';
      case 'FEB': return 'February';
      case 'MAR': return 'March';
      case 'APR': return 'April';
      case 'MAY': return 'May';
      case 'JUN': return 'June';
      case 'JUL': return 'July';
      case 'AUG': return 'August';
      case 'SEP': return 'September';
      case 'OCT': return 'October';
      case 'NOV': return 'November';
      case 'DEC': return 'December';
      case 'AFT': return 'after';
      case 'BET': return 'between';
      case 'BEF': return 'before';
      case 'ABT': return 'about';
      case 'CAL': return 'calculated';
      case 'EST': return 'estimated';
      default: return s.toLowerCase();
    }
  }).replace(/^\w/, (s) => s.toUpperCase());

  // const dateHelper = '(?:(?:(\\d+) +)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) +)(\\d+)'
  // const dateValue = new RegExp(`^${dateHelper}$`)
  // const datePeriod = new RegExp(`^FROM +${dateHelper} +TO +${dateHelper}$`)
  // const dateRange = new RegExp(`^BET +${dateHelper} +AND +${dateHelper}$`)
  // const dateApprox = new RegExp(`^(FROM|TO|AFT|BEF|ABT|CAL|EST) +${dateHelper}$`)

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseEventShare(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag !== '_SHAR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
  return gedcomRecord.value;
}

function parseEventType(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag !== 'TYPE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
  return gedcomRecord.value;
}
