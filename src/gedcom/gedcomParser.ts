import type {GedcomRecord} from './gedcomRecord';
import {GedcomEvent, parseEvent} from './gedcomEvent';
import {GedcomFamily, parseFamily} from './gedcomFamily';
import {parseCitation} from './gedcomCitation';
import {GedcomIndividual, parseIndividual} from './gedcomIndividual';
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
      case 'INDI': {
        const gedcomIndividual = parseIndividual(gedcomRecord, this.ancestryService, reportUnparsedRecord);
        this.ancestryService.individuals.update(
            (individuals) => individuals.set(gedcomIndividual.xref, gedcomIndividual));
        break;
      }
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
};
