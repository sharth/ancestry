import type { Signal} from '@angular/core';
import {Component} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import type { GedcomRepository } from '../../gedcom/gedcomRepository';
import type * as rxjs from 'rxjs';

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css',
})
export class RepositoriesComponent {
  readonly repositories$: rxjs.Observable<GedcomRepository[]> = ancestryService.repositories();
  readonly repositories: Signal<GedcomRepository[]> = toSignal(ancestryService.repositories(), {initialValue: []});
}
