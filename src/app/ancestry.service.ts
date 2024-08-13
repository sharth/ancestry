import {signal} from '@angular/core';
import type {GedcomFamily} from '../gedcom/gedcomFamily';
import type {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import type {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomHeader} from '../gedcom/gedcomHeader';
import {GedcomTrailer} from '../gedcom/gedcomTrailer';
import type {GedcomRecord} from '../gedcom/gedcomRecord';
import {parseGedcomRecordsFromText} from '../gedcom/gedcomRecord.parser';
import {List as ImmutableList} from 'immutable';
import {constructSourceFromGedcomRecord} from '../gedcom/gedcomSource.parser';
import {serializeGedcomSourceToGedcomRecord} from '../gedcom/gedcomSource.serializer';
import {ancestryDatabase} from '../database/ancestry.database';
import {serializeGedcomRecordToText} from '../gedcom/gedcomRecord.serializer';
import {parseGedcomIndividualFromGedcomRecord} from '../gedcom/gedcomIndividual.parser';
import {serializeGedcomIndividualToGedcomRecord} from '../gedcom/gedcomIndividual.serializer';
import {parseGedcomFamilyFromGedcomRecord} from '../gedcom/gedcomFamily.parser';
import {serializeGedcomFamilyToGedcomRecord} from '../gedcom/gedcomFamily.serializer';
import * as dexie from 'dexie';
import * as rxjs from 'rxjs'
import { toObservable } from '@angular/core/rxjs-interop';

export class AncestryService {
  #headers = signal(ImmutableList<GedcomHeader>());
  #trailers = signal(ImmutableList<GedcomTrailer>());

  readonly originalGedcomText = signal<string>('');

  private readonly unparsedTags = new Set<string>();

  individual(xref: string): rxjs.Observable<GedcomIndividual | undefined> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.individuals.get(xref)));
  }

  individuals(): rxjs.Observable<GedcomIndividual[]> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.individuals.toArray()))
  }

  family(xref: string): rxjs.Observable<GedcomFamily | undefined> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.families.get(xref)));
  }

  families(): rxjs.Observable<GedcomFamily[]> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.families.toArray()));
  }

  repository(xref: string): rxjs.Observable<GedcomRepository | undefined> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.repositories.get(xref)));
  }

  repositories(): rxjs.Observable<GedcomRepository[]> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.repositories.toArray()));
  }

  source(xref: string): rxjs.Observable<GedcomSource | undefined> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.sources.get(xref)));
  }

  sources(): rxjs.Observable<GedcomSource[]> {
    return rxjs.from(dexie.liveQuery(() => ancestryDatabase.sources.toArray()));
  }

  headers(): rxjs.Observable<GedcomHeader[]> {
    return toObservable(this.#headers).pipe(
      rxjs.map((headers) => headers.toArray()),
    );
  }

  trailers(): rxjs.Observable<GedcomTrailer[]> {
    return toObservable(this.#trailers).pipe(
      rxjs.map((trailers) => trailers.toArray())
    );
  }

  gedcomRecords(): rxjs.Observable<GedcomRecord[]> {
    return rxjs.combineLatest([
      this.headers(),
      this.individuals(),
      this.families(),
      this.sources(),
      this.repositories(),
      this.trailers(),
    ]).pipe(
      rxjs.map(([headers, individuals, families, sources, repositories, trailers]) => [
        ...headers.map((header) => header.gedcomRecord()),
        ...individuals.map((individual) => serializeGedcomIndividualToGedcomRecord(individual)),
        ...families.map((family) => serializeGedcomFamilyToGedcomRecord(family)),
        ...sources.map((source) => serializeGedcomSourceToGedcomRecord(source)),
        ...repositories.map((repository) => repository.gedcomRecord),
        ...trailers.map((trailer) => trailer.gedcomRecord),
      ])
    )
  }

  gedcomText(): rxjs.Observable<string> {
    return this.gedcomRecords().pipe(
      rxjs.map((records) => records.flatMap(serializeGedcomRecordToText).join('\n'))
    )
  }

  parseText(text: string) {
    this.#headers.set(ImmutableList());
    this.#trailers.set(ImmutableList());

    // Remember the gedcomText that was passed in.
    this.originalGedcomText.set(text);

    for (const gedcomRecord of parseGedcomRecordsFromText(text)) {
      switch (gedcomRecord.tag) {
        case 'HEAD': {
          const gedcomHeader = new GedcomHeader(gedcomRecord);
          this.#headers.update((headers) => headers.push(gedcomHeader));
          break;
        }
        case 'TRLR': {
          const gedcomTrailer = new GedcomTrailer(gedcomRecord);
          this.#trailers.update((trailers) => trailers.push(gedcomTrailer));
          break;
        }
        case 'INDI': {
          const gedcomIndividual = parseGedcomIndividualFromGedcomRecord(gedcomRecord);
          ancestryDatabase.individuals.add(gedcomIndividual);
          break;
        }
        case 'FAM': {
          const gedcomFamily = parseGedcomFamilyFromGedcomRecord(gedcomRecord);
          ancestryDatabase.families.add(gedcomFamily);
          break;
        }
        case 'REPO': {
          const gedcomRepository = new GedcomRepository(gedcomRecord);
          ancestryDatabase.repositories.add(gedcomRepository);
          break;
        }
        case 'SOUR': {
          const gedcomSource = constructSourceFromGedcomRecord(gedcomRecord);
          ancestryDatabase.sources.add(gedcomSource);
          break;
        }

        // case 'SUBM': {
        //   const gedcomSubmitter = new GedcomSubmitter(gedcomRecord);
        //   this.records.update(
        //       (records) => records.set(gedcomSubmitter.xref, gedcomSubmitter));
        //   break;
        // }
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
