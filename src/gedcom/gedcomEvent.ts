import {parseCitation, type GedcomCitation} from './gedcomCitation';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomEvent {
  constructor(
    public type: string,
    public gedcomRecord: GedcomRecord) { }

  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  dateDescriptive?: string;
  value?: string;
  citations: GedcomCitation[] = [];
  sharedWithXrefs: string[] = [];
}

export function parseEvent(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): GedcomEvent {
  if (gedcomRecord.xref != null) throw new Error();

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
  ]).get(gedcomRecord.tag) ?? gedcomRecord.tag;

  const gedcomEvent = new GedcomEvent(type, gedcomRecord);
  gedcomEvent.value = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case '_SHAR':
        parseEventShare(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case 'SOUR':
        gedcomEvent.citations.push(parseCitation(childRecord, reportUnparsedRecord));
        break;
      case 'DATE':
        parseEventDate(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case 'TYPE':
        parseEventType(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case 'ADDR':
        parseEventAddress(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case 'PLAC':
        parseEventPlace(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case 'CAUS':
        parseEventCause(gedcomEvent, childRecord, reportUnparsedRecord);
        break;
      case '_SENT': break;
      case '_SDATE': break;
      case '_PRIM': break;
      case '_PROOF': break;
      case 'NOTE': break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomEvent;
}

function parseEventAddress(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'ADDR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.address = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseEventPlace(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'PLAC') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.place = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseEventCause(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'CAUS') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.cause = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseEventDate(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'DATE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.date = gedcomRecord.value;
  gedcomEvent.dateDescriptive = gedcomEvent.date.replaceAll(/\w+/g, (s: string) => {
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
      default: reportUnparsedRecord(childRecord); break;
    }
  }
}

function parseEventShare(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== '_SHAR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.sharedWithXrefs.push(gedcomRecord.value);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'ROLE': break;
      default: reportUnparsedRecord(childRecord); break;
    }
  }
}

function parseEventType(
    gedcomEvent: GedcomEvent,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'TYPE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomEvent.type = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord); break;
    }
  }
}

