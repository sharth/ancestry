import type {GedcomRecord} from './gedcomRecord';
import {GedcomEvent, parseEvent} from './gedcomEvent';
import {GedcomFamily} from './gedcomFamily';
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
    switch (gedcomRecord.tag) {
      case 'HEAD': {
        // Only one header should be found in the gedcom file.
        if (this.ancestryService.header() != null) throw new Error();
        const gedcomHeader = parseHeader(gedcomRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
        this.ancestryService.header.set(gedcomHeader);
        break;
      }
      case 'TRLR': this.parseTrailer(gedcomRecord); break;
      case 'INDI': this.parseIndividual(gedcomRecord); break;
      case 'FAM': this.parseFamily(gedcomRecord); break;
      case 'REPO': {
        const gedcomRepository = parseRepository(gedcomRecord, (record) => this.reportUnparsedRecord(record));
        this.ancestryService.repositories.update(
            (repositories) => repositories.set(gedcomRepository.xref, gedcomRepository ));
        break;
      }
      case 'SOUR': {
        const gedcomSource = parseSource(gedcomRecord, (record:GedcomRecord) => this.reportUnparsedRecord(record));
        this.ancestryService.sources.update(
            (sources) => sources.set(gedcomSource.xref, gedcomSource));
        break;
      }
      default: this.reportUnparsedRecord(gedcomRecord); break;
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

  parseFamily(gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM') throw new Error();
    if (gedcomRecord.xref == null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();

    const xref = gedcomRecord.xref;
    const gedcomFamily = new GedcomFamily(xref, gedcomRecord, this.ancestryService);

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'CHIL': this.parseFamilyChild(gedcomFamily, childRecord); break;
        case 'HUSB': this.parseFamilyHusband(gedcomFamily, childRecord); break;
        case 'WIFE': this.parseFamilyWife(gedcomFamily, childRecord); break;
        case 'DIV':
          parseEvent(gedcomFamily, childRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
          break;
        case 'EVEN':
          parseEvent(gedcomFamily, childRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
          break;
        case 'MARR':
          parseEvent(gedcomFamily, childRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
          break;
        case 'MARB':
          parseEvent(gedcomFamily, childRecord, (record: GedcomRecord) => this.reportUnparsedRecord(record));
          break;
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }

    this.ancestryService.families.update((families) => families.set(xref, gedcomFamily));
  }

  parseFamilyChild(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.CHIL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const childXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.childOfFamilyXref = gedcomFamily.xref;
    gedcomFamily.childXrefs.push(childXref);

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }
  }

  parseFamilyHusband(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.HUSB') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const husbandXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    gedcomFamily.husbandXref = husbandXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }
  }

  parseFamilyWife(gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.WIFE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const wifeXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    gedcomFamily.wifeXref = wifeXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break;
      }
    }
  }
};
