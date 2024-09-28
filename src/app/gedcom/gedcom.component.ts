import { CommonModule } from '@angular/common';
import {Component} from '@angular/core';
import { ancestryDatabase } from '../../database/ancestry.database';
import * as dexie from 'dexie';
import * as rxjs from 'rxjs';
import * as gedcom from '../../gedcom';
import { GedcomDiffComponent } from '../../util/gedcom-diff.component';
import { serializeGedcomHeaderToGedcomRecord, serializeGedcomIndividualToGedcomRecord, serializeGedcomFamilyToGedcomRecord, serializeGedcomSourceToGedcomRecord, serializeGedcomRecordToText, serializeGedcomRepositoryToGedcomRecord } from '../../util/gedcom-serializer';
import { GedcomLexer } from '../../util/gedcom-lexer';

@Component({
  selector: 'app-gedcom',
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: './gedcom.component.html',
  styleUrl: './gedcom.component.css',
})
export class GedcomComponent {
  readonly vm$ = rxjs.combineLatest([
    this.oldGedcomText(),
    this.newGedcomRecords(),
  ]).pipe(
    rxjs.map(([oldGedcomText, newGedcomRecords]) => ({
      oldGedcomText: oldGedcomText,
      newGedcomText: newGedcomRecords.flatMap(serializeGedcomRecordToText).join("\r\n"),
    })),
  );

  oldGedcomText(): rxjs.Observable<string> {
    return rxjs.from(dexie.liveQuery(async () => {
      const [{text: originalText}] = await ancestryDatabase.originalText.toArray();
      return originalText;
    }))
  }

  // Current set of GedcomRecords, but organized similarly to the text that came in from the user.
  newGedcomRecords(): rxjs.Observable<gedcom.GedcomRecord[]> {
    return rxjs.from(dexie.liveQuery(async () => {
      const newGedcomRecords = [
        ...(await ancestryDatabase.headers.toArray()).map(serializeGedcomHeaderToGedcomRecord),
        ...(await ancestryDatabase.submitters.toArray()).map((submitter) => submitter.gedcomRecord),
        ...(await ancestryDatabase.trailers.toArray()).map((trailer) => trailer.record),
        ...(await ancestryDatabase.individuals.toArray()).map(serializeGedcomIndividualToGedcomRecord),
        ...(await ancestryDatabase.families.toArray()).map(serializeGedcomFamilyToGedcomRecord),
        ...(await ancestryDatabase.sources.toArray()).map(serializeGedcomSourceToGedcomRecord),
        ...(await ancestryDatabase.repositories.toArray()).map(serializeGedcomRepositoryToGedcomRecord),
        ...(await ancestryDatabase.multimedia.toArray()).map(gedcom.serializeGedcomMultimediaToGedcomRecord),
      ];

      // We'd like to reorder the gedcom records more or less in the order that we received the file.
      const [{text: oldGedcomText}] = await ancestryDatabase.originalText.toArray();
      const oldGedcomRecords = new GedcomLexer().parseGedcomRecords(oldGedcomText);

      const orderedRecords = new Map<string, gedcom.GedcomRecord[]>();
      oldGedcomRecords
        .filter((gedcomRecord) => gedcomRecord.abstag != 'TRLR')
        .forEach((gedcomRecord) => {
          const order = `${gedcomRecord.tag} ${gedcomRecord.xref ?? ''} ${gedcomRecord.value ?? ''}`;
          orderedRecords.set(order, []);
        });
      newGedcomRecords
        .forEach((gedcomRecord) => {
          const order = `${gedcomRecord.tag} ${gedcomRecord.xref ?? ''} ${gedcomRecord.value ?? ''}`;
          if (!orderedRecords.get(order)?.push(gedcomRecord))
            orderedRecords.set(order, [gedcomRecord]);
        });

      return Array.from(orderedRecords.values()).flat();
    }));
  }
}
