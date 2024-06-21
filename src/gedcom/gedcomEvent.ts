import type {AncestryService} from '../app/ancestry.service';
import {GedcomCitation} from './gedcomCitation';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomEvent {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.xref != null) throw new Error();

    this.type = new Map([
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

    this.value = record.value;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case '_SHAR':
          this.sharedWithXrefs.push(this.parseEventShare(childRecord));
          break;
        case 'SOUR':
          this.citations.push(new GedcomCitation(childRecord, ancestryService));
          break;
        case 'DATE':
          this.parseEventDate(childRecord);
          break;
        case 'TYPE':
          this.type = this.parseEventType(childRecord);
          break;
        case 'ADDR':
          this.address = this.parseEventAddress(childRecord);
          break;
        case 'PLAC':
          this.place = this.parseEventPlace(childRecord);
          break;
        case 'CAUS':
          this.cause = this.parseEventCause(childRecord);
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
  }

  private parseEventAddress(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.tag !== 'ADDR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord.bind(this.ancestryService));
    return gedcomRecord.value;
  }

  private parseEventPlace(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.tag !== 'PLAC') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord.bind(this.ancestryService));
    return gedcomRecord.value;
  }

  private parseEventCause(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.tag !== 'CAUS') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord.bind(this.ancestryService));
    return gedcomRecord.value;
  }

  private parseEventDate(gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'DATE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    this.date = gedcomRecord.value;
    this.dateDescriptive = this.date.replaceAll(/\w+/g, (s: string) => {
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
          this.ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseEventShare(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.tag !== '_SHAR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord.bind(this.ancestryService));
    return gedcomRecord.value;
  }

  private parseEventType(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.tag !== 'TYPE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord.bind(this.ancestryService));
    return gedcomRecord.value;
  }

  type: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  dateDescriptive?: string;
  value?: string;
  citations: GedcomCitation[] = [];
  sharedWithXrefs: string[] = [];

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
}
