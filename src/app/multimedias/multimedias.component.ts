import {Component} from '@angular/core';
import {CommonModule, KeyValuePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import { ancestryDatabase } from '../../database/ancestry.database';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GedcomMultimedia } from '../../gedcom/gedcomMultimedia';

@Component({
  selector: 'app-multimedias',
  standalone: true,
  imports: [CommonModule, RouterLink, KeyValuePipe, ReactiveFormsModule],
  templateUrl: './multimedias.component.html',
  styleUrl: './multimedias.component.css',
})
export class MultimediasComponent {
  readonly vm$ = rxjs.from(dexie.liveQuery(() => ancestryDatabase.multimedia.toArray())).pipe(
    rxjs.map((multimedias) => ({
        multimedias: multimedias,
    }))
  );

  readonly reactiveForm = new FormGroup({
    filePath: new FormControl('', {nonNullable: true}),
    mediaType: new FormControl('', {nonNullable: true}),
  })

  nextXref(): Promise<string> {
    return ancestryDatabase.transaction("r", [ancestryDatabase.multimedia], async () => {
      let xref = "@M0@";
      (await ancestryDatabase.multimedia.toArray())
        .map((gedcomMultimedia) => gedcomMultimedia.xref)
        .forEach((next) => {
        const xrefMatch = /^@.*([0-9]+)@$/.exec(xref)
        const nextMatch = /^@.*([0-9]+)@$/.exec(next)
        if (xrefMatch != null && nextMatch != null && Number(xrefMatch[1]) < Number(nextMatch[1])) {
          xref = next;
        }
      });
      const xrefMatch = /^(@.*)([0-9]+)(@)$/.exec(xref)!
      return xrefMatch[1] + String(Number(xrefMatch[2]) + 1) + xrefMatch[3];
    })
  }

  submitForm() {
    ancestryDatabase.transaction("rw", [ancestryDatabase.multimedia], async () => {
      const gedcomMultimedia = new GedcomMultimedia(await this.nextXref());
      gedcomMultimedia.filePath = this.reactiveForm.controls.filePath.value.trim() || undefined;
      gedcomMultimedia.mediaType = this.reactiveForm.controls.mediaType.value.trim() || undefined;
      await ancestryDatabase.multimedia.add(gedcomMultimedia);
    }).then(() => {
      console.log("Transaction committed");
    }).catch((err: unknown) => {
      console.error(err);
    });
  }
}
