import {computed, Injectable, signal} from '@angular/core';
import {GedcomFamily} from '../gedcom/gedcomFamily';
import {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomHeader} from '../gedcom/gedcomHeader';
import {GedcomTrailer} from '../gedcom/gedcomTrailer';
import type {GedcomRecord} from '../gedcom/gedcomRecord';
import {parseGedcomRecordsFromText} from '../gedcom/gedcomRecord';
import {Map as ImmutableMap} from 'immutable';
import {List as ImmutableList} from 'immutable';

@Injectable({providedIn: 'root'})
export class AncestryService {
  readonly headers = signal(ImmutableList<GedcomHeader>());
  readonly trailers = signal(ImmutableList<GedcomTrailer>());

  readonly individuals = signal(ImmutableMap<string, GedcomIndividual>({}));
  readonly families = signal(ImmutableMap<string, GedcomFamily>());
  readonly sources = signal(ImmutableMap<string, GedcomSource>());
  readonly repositories = signal(ImmutableMap<string, GedcomRepository>());

  readonly originalGedcomText = signal<string>('');

  private readonly unparsedTags = new Set<string>();

  individual(xref: string): GedcomIndividual {
    const individual = this.individuals().get(xref);
    if (individual == null) throw new Error(`No individual with xref '${xref}'`);
    return individual;
  }

  family(xref: string): GedcomFamily {
    const family = this.families().get(xref);
    if (family == null) throw new Error(`No family with xref '${xref}'`);
    return family;
  }

  repository(xref: string): GedcomRepository {
    const repository = this.repositories().get(xref);
    if (repository == null) throw new Error(`No repository with xref '${xref}`);
    return repository;
  }

  source(xref: string): GedcomSource {
    const source = this.sources().get(xref);
    if (source == null) throw new Error(`No source with xref '${xref}`);
    return source;
  }

  gedcomRecords = computed<GedcomRecord[]>(() => {
    return Array.from([
      ...this.headers(),
      ...this.individuals().values(),
      ...this.families().values(),
      ...this.sources().values(),
      ...this.repositories().values(),
      ...this.trailers(),
    ], (gedcomObject) => gedcomObject.gedcomRecord());
  });

  parseText(text: string) {
    this.headers.set(ImmutableList<GedcomHeader>());
    this.trailers.set(ImmutableList<GedcomTrailer>());
    this.individuals.set(ImmutableMap<string, GedcomIndividual>({}));
    this.families.set(ImmutableMap<string, GedcomFamily>());
    this.repositories .set(ImmutableMap<string, GedcomRepository>());
    this.sources.set(ImmutableMap<string, GedcomSource>());

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
          const gedcomIndividual = new GedcomIndividual(gedcomRecord, this);
          this.individuals.update(
              (individuals) => individuals.set(gedcomIndividual.xref, gedcomIndividual));
          break;
        }
        case 'FAM': {
          const gedcomFamily = new GedcomFamily(gedcomRecord, this);
          this.families.update(
              (families) => families.set(gedcomFamily.xref, gedcomFamily));
          break;
        }
        case 'REPO': {
          const gedcomRepository = new GedcomRepository(gedcomRecord, this);
          this.repositories.update(
              (repositories) => repositories.set(gedcomRepository.xref, gedcomRepository ));
          break;
        }
        case 'SOUR': {
          const gedcomSource = new GedcomSource(gedcomRecord, this);
          this.sources.update(
              (sources) => sources.set(gedcomSource.xref, gedcomSource));
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
