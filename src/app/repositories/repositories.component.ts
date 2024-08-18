import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import { ancestryDatabase } from '../../database/ancestry.database';

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css',
})
export class RepositoriesComponent {
  readonly repositories$ = rxjs.from(dexie.liveQuery(() => ancestryDatabase.repositories.toArray()));
  readonly repositories = toSignal(this.repositories$, {initialValue: []});
}
