import {Component, computed, inject} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.css',
})
export class SourcesComponent {
  ancestryService = inject(AncestryService);

  readonly sources = computed(() =>
    this.ancestryService.sources().toList()
        .sort((lhs, rhs) => (lhs.abbr?.value ?? '').localeCompare(rhs.abbr?.value ?? '')));
}
