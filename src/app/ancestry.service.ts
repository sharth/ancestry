import {signal} from '@angular/core';
import {ancestryDatabase} from '../database/ancestry.database';
import * as dexie from 'dexie';
import * as rxjs from 'rxjs';
import * as gedcom from '../gedcom';

export class AncestryService {
  readonly originalGedcomText = signal<string>('');

  private readonly unparsedTags = new Set<string>();

  gedcomRecords(): rxjs.Observable<gedcom.GedcomRecord[]> {
    return rxjs.combineLatest([
      dexie.liveQuery(() => ancestryDatabase.headers.toArray()),
      dexie.liveQuery(() => ancestryDatabase.submitters.toArray()),
      dexie.liveQuery(() => ancestryDatabase.individuals.toArray()),
      dexie.liveQuery(() => ancestryDatabase.families.toArray()),
      dexie.liveQuery(() => ancestryDatabase.sources.toArray()),
      dexie.liveQuery(() => ancestryDatabase.repositories.toArray()),
      dexie.liveQuery(() => ancestryDatabase.trailers.toArray()),
    ]).pipe(
      rxjs.map(([headers, submitters, individuals, families, sources, repositories, trailers]) => [
        ...headers.map(gedcom.serializeGedcomHeaderToGedcomRecord),
        ...submitters.map((submitter) => submitter.gedcomRecord),
        ...individuals.map(gedcom.serializeGedcomIndividualToGedcomRecord),
        ...families.map(gedcom.serializeGedcomFamilyToGedcomRecord),
        ...sources.map(gedcom.serializeGedcomSourceToGedcomRecord),
        ...repositories.map((repository) => repository.gedcomRecord),
        ...trailers.map(gedcom.serializeGedcomTrailerToGedcomRecord),
      ])
    )
  }

  gedcomText(): rxjs.Observable<string> {
    return this.gedcomRecords().pipe(
      rxjs.map((records) => records.flatMap(gedcom.serializeGedcomRecordToText).join('\n'))
    )
  }

  parseText(text: string) {
    // Clear the database.
    ancestryDatabase.delete({disableAutoOpen: false});

    // Remember the gedcomText that was passed in.
    ancestryDatabase.originalText.add({text: text});

    for (const gedcomRecord of gedcom.parseGedcomRecordsFromText(text)) {
      switch (gedcomRecord.tag) {
        case 'HEAD':
          ancestryDatabase.headers.add(new gedcom.GedcomHeader(gedcomRecord));
          break;
        case 'SUBM':
          ancestryDatabase.submitters.add(new gedcom.GedcomSubmitter(gedcomRecord));
          break;
        case 'TRLR':
          ancestryDatabase.trailers.add(new gedcom.GedcomTrailer(gedcomRecord));
          break;
        case 'INDI':
          ancestryDatabase.individuals.add(gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord));
          break;
        case 'FAM':
          ancestryDatabase.families.add(gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord));
          break;
        case 'REPO':
          ancestryDatabase.repositories.add(new gedcom.GedcomRepository(gedcomRecord));
          break;
        case 'SOUR':
          ancestryDatabase.sources.add(gedcom.constructSourceFromGedcomRecord(gedcomRecord));
          break;
        case 'OBJE':
          ancestryDatabase.multimedia.add(gedcom.constructGedcomMultimediaFromGedcomRecord(gedcomRecord));
          break;
        default:
          this.reportUnparsedRecord(gedcomRecord);
          break;
      }
    }
  }

  reportUnparsedRecord(gedcomRecord: gedcom.GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag);
      this.unparsedTags.add(gedcomRecord.abstag);
    }
  }
}

export const ancestryService = new AncestryService;
