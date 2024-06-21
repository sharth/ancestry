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
    return this.ancestryService.headers()
        .flatMap((header) => header.gedcomRecord().text())
        .join('\n');
  });

  trailerText = computed(() => {
    return this.ancestryService.trailers()
        .flatMap((trailer) => trailer.gedcomRecord().text())
        .join('\n');
  });
}
