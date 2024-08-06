import {computed, signal} from '@angular/core';
import {GedcomFamily} from '../gedcom/gedcomFamily';
import {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomHeader} from '../gedcom/gedcomHeader';
import {GedcomTrailer} from '../gedcom/gedcomTrailer';
import type {GedcomRecord} from '../gedcom/gedcomRecord';
import {parseGedcomRecordsFromText} from '../gedcom/gedcomRecord.parser';
import {OrderedMap as ImmutableOrderedMap} from 'immutable';
import {List as ImmutableList} from 'immutable';
import {GedcomSubmitter} from '../gedcom/gedcomSubmitter';
import {constructSourceFromGedcomRecord} from '../gedcom/gedcomSource.parser';
import {serializeGedcomSourceToGedcomRecord} from '../gedcom/gedcomSource.serializer';
import {ancestryDatabase} from '../database/ancestry.database';
import {serializeGedcomRecordToText} from '../gedcom/gedcomRecord.serializer';
import {parseGedcomIndividualFromGedcomRecord} from '../gedcom/gedcomIndividual.parser';
import {serializeGedcomIndividualToGedcomRecord} from '../gedcom/gedcomIndividual.serializer';
import {parseGedcomFamilyFromGedcomRecord} from '../gedcom/gedcomFamily.parser';
import {serializeGedcomFamilyToGedcomRecord} from '../gedcom/gedcomFamily.serializer';

export class AncestryService {
  readonly headers = signal(ImmutableList<GedcomHeader>());
  readonly trailers = signal(ImmutableList<GedcomTrailer>());
  readonly records = signal(ImmutableOrderedMap<
    string, GedcomIndividual | GedcomFamily | GedcomSource | GedcomRepository | GedcomSubmitter>());

  readonly originalGedcomText = signal<string>('');

  private readonly unparsedTags = new Set<string>();

  individual(xref: string): GedcomIndividual {
    const individual = this.records().get(xref);
    if (individual == null) throw new Error(`No individual with xref '${xref}'`);
    if (!(individual instanceof GedcomIndividual)) throw new Error(`${xref} is not a GedcomIndividual`);
    return individual;
  }

  individuals(): ImmutableList<GedcomIndividual> {
    return this.records()
        .toList()
        .filter((record) => record instanceof GedcomIndividual);
  }

  family(xref: string): GedcomFamily {
    const family = this.records().get(xref);
    if (family == null) throw new Error(`No family with xref '${xref}'`);
    if (!(family instanceof GedcomFamily)) throw new Error(`${xref} is not a GedcomFamilys`);
    return family;
  }

  families(): ImmutableList<GedcomFamily> {
    return this.records()
        .toList()
        .filter((record) => record instanceof GedcomFamily);
  }

  repository(xref: string): GedcomRepository {
    const repository = this.records().get(xref);
    if (repository == null) throw new Error(`No repository with xref '${xref}`);
    if (!(repository instanceof GedcomRepository)) throw new Error(`${xref} is not a GedcomRepository`);
    return repository;
  }

  repositories(): ImmutableList<GedcomRepository> {
    return this.records()
        .toList()
        .filter((record) => record instanceof GedcomRepository);
  }

  source(xref: string): GedcomSource {
    const source = this.records().get(xref);
    if (source == null) throw new Error(`No source with xref '${xref}`);
    if (!(source instanceof GedcomSource)) throw new Error(`${xref} is not a GedcomSource`);
    return source;
  }

  sources(): ImmutableList<GedcomSource> {
    return this.records()
        .toList()
        .filter((record) => record instanceof GedcomSource);
  }

  readonly gedcomRecords = computed<GedcomRecord[]>(() => [
    ...this.headers().map((header) => header.gedcomRecord()),
    ...this.individuals().map(serializeGedcomIndividualToGedcomRecord),
    ...this.families().map(serializeGedcomFamilyToGedcomRecord),
    ...this.sources().map((source) => serializeGedcomSourceToGedcomRecord(source)),
    ...this.repositories().map((repository) => repository.gedcomRecord),
    ...this.trailers().map((trailer) => trailer.gedcomRecord),
  ]);

  readonly gedcomText = computed<string>(() => this.gedcomRecords()
      .flatMap(serializeGedcomRecordToText)
      .join('\n'));

  parseText(text: string) {
    this.headers.set(ImmutableList());
    this.trailers.set(ImmutableList());
    this.records.set(ImmutableOrderedMap());

    // Remember the gedcomText that was passed in.
    this.originalGedcomText.set(text);

    for (const gedcomRecord of parseGedcomRecordsFromText(text)) {
      switch (gedcomRecord.tag) {
        case 'HEAD': {
          const gedcomHeader = new GedcomHeader(gedcomRecord);
          this.headers.update((headers) => headers.push(gedcomHeader));
          break;
        }
        case 'TRLR': {
          const gedcomTrailer = new GedcomTrailer(gedcomRecord);
          this.trailers.update((trailers) => trailers.push(gedcomTrailer));
          break;
        }
        case 'INDI': {
          const gedcomIndividual = parseGedcomIndividualFromGedcomRecord(gedcomRecord);
          this.records.update(
              (records) => records.set(gedcomIndividual.xref, gedcomIndividual));
          ancestryDatabase.individuals.add(gedcomIndividual);
          break;
        }
        case 'FAM': {
          const gedcomFamily = parseGedcomFamilyFromGedcomRecord(gedcomRecord);
          this.records.update(
              (records) => records.set(gedcomFamily.xref, gedcomFamily));
          ancestryDatabase.families.add(gedcomFamily);
          break;
        }
        case 'REPO': {
          const gedcomRepository = new GedcomRepository(gedcomRecord);
          this.records.update(
              (records) => records.set(gedcomRepository.xref, gedcomRepository ));
          ancestryDatabase.repositories.add(gedcomRepository);
          break;
        }
        case 'SOUR': {
          const gedcomSource = constructSourceFromGedcomRecord(gedcomRecord);
          this.records.update(
              (records) => records.set(gedcomSource.xref, gedcomSource));
          ancestryDatabase.sources.add(gedcomSource);
          break;
        }

        case 'SUBM': {
          const gedcomSubmitter = new GedcomSubmitter(gedcomRecord);
          this.records.update(
              (records) => records.set(gedcomSubmitter.xref, gedcomSubmitter));
          break;
        }
        default:
          this.reportUnparsedRecord(gedcomRecord);
          break;
      }
    }
  }

  reportUnparsedRecord(gedcomRecord: GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag);
      this.unparsedTags.add(gedcomRecord.abstag);
    }
  }
}

export const ancestryService = new AncestryService;
