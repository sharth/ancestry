import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent {
  readonly ancestryService = ancestryService;

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
