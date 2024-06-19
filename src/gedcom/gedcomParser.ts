import type {GedcomRecord} from './gedcomRecord';
import {GedcomEvent, parseEvent} from './gedcomEvent';
import {GedcomFamily, parseFamily} from './gedcomFamily';
import {parseCitation} from './gedcomCitation';
import {GedcomIndividual} from './gedcomIndividual';
import {parseSource} from './gedcomSource';
import {parseRepository} from './gedcomRepository';
import {parseHeader} from './gedcomHeader';
import type {AncestryService} from '../app/ancestry.service';

export class GedcomParser {
  constructor(public readonly ancestryService: AncestryService) { }
  private readonly unparsedTags = new Set<string>();

  reportUnparsedRecord(gedcomRecord: GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag);
      this.unparsedTags.add(gedcomRecord.abstag);
    }
  }

  parse(gedcomRecord: GedcomRecord): void {
    const reportUnparsedRecord = this.reportUnparsedRecord.bind(this);
    switch (gedcomRecord.tag) {
      case 'HEAD': {
        // Only one header should be found in the gedcom file.
        if (this.ancestryService.header() != null) throw new Error();
        const gedcomHeader = parseHeader(gedcomRecord, reportUnparsedRecord);
        this.ancestryService.header.set(gedcomHeader);
        break;
      }
      case 'TRLR': this.parseTrailer(gedcomRecord); break;
      case 'INDI': this.parseIndividual(gedcomRecord); break;
      case 'FAM': {
        const gedcomFamily = parseFamily(gedcomRecord, this.ancestryService, reportUnparsedRecord);
        this.ancestryService.families.update(
            (families) => families.set(gedcomFamily.xref, gedcomFamily));
        break;
      }
      case 'REPO': {
        const gedcomRepository = parseRepository(gedcomRecord, reportUnparsedRecord);
        this.ancestryService.repositories.update(
            (repositories) => repositories.set(gedcomRepository.xref, gedcomRepository ));
        break;
      }
      case 'SOUR': {
        const gedcomSource = parseSource(gedcomRecord, reportUnparsedRecord);
        this.ancestryService.sources.update(
            (sources) => sources.set(gedcomSource.xref, gedcomSource));
        break;
      }
      default:
        this.reportUnparsedRecord(gedcomRecord);
        break;
    }
  }

  parseTrailer(gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'TRLR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();
    if (gedcomRecord.children.length != 0) throw new Error();
  }

  parseIndividual(gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI') throw new Error();
    if (gedcomRecord.xref == null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();

    const xref = gedcomRecord.xref;
    const gedcomIndividual = new GedcomIndividual(xref, gedcomRecord, this.ancestryService);

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
          parseEvent(gedcomIndividual, childRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
          break;
        case 'NAME':
          this.parseIndividualName(gedcomIndividual, childRecord);
          break;
        case 'SEX':
          this.parseIndividualSex(gedcomIndividual, childRecord);
          break;
        case 'FAMS': break; // Let's just use the links inside the Family record.
        case 'FAMC': break; // Let's just use the links inside the Family record.
        case '_FSFTID':
          this.parseIndividualFamilySearchId(gedcomIndividual, childRecord);
          break;
        default:
          this.reportUnparsedRecord(childRecord);
          break;
      }
    }

    this.ancestryService.individuals.update((individuals) => individuals.set(xref, gedcomIndividual));
  }

  parseIndividualFamilySearchId(gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomIndividual.familySearchId ??= gedcomRecord.value;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }
  }

  parseIndividualName(gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
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
          gedcomEvent.citations.push(parseCitation(
              childRecord,
              (record: GedcomRecord) => this.reportUnparsedRecord(record)));
          break;
        default:
          this.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseIndividualSex(gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const gedcomEvent = new GedcomEvent('Sex', gedcomRecord);
    gedcomIndividual.events.push(gedcomEvent);
    gedcomEvent.value = gedcomRecord.value;

    if (gedcomIndividual.sex == null) {
      switch (gedcomRecord.value) {
        case 'M': gedcomIndividual.sex = 'Male'; break;
        case 'F': gedcomIndividual.sex = 'Female'; break;
      }
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }
  }
};
