import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.css',
})
export class SourcesComponent {
  readonly ancestryService = ancestryService;

  readonly sources = computed(() =>
    this.ancestryService.sources()
        .sort((lhs, rhs) => (lhs.abbr?.value ?? '').localeCompare(rhs.abbr?.value ?? '')));
}
