import {Component, computed, inject} from '@angular/core';
import {AncestryService} from '../ancestry.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent {
  ancestryService = inject(AncestryService);

  headerText = computed(() => {
    return this.ancestryService.headers().flatMap((header) => header.record.gedcom()).join('\n');
  });

  trailerText = computed(() => {
    return this.ancestryService.trailers().flatMap((trailer) => trailer.record.gedcom()).join('\n');
  });
}
