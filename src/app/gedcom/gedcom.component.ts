import {Component, computed, inject} from '@angular/core';
import {AncestryService} from '../ancestry.service';

@Component({
  selector: 'app-gedcom',
  standalone: true,
  imports: [],
  templateUrl: './gedcom.component.html',
  styleUrl: './gedcom.component.css',
})
export class GedcomComponent {
  ancestryService = inject(AncestryService);
  gedcomText = computed(() => this.ancestryService.database().gedcomRecords()
      .map((record) => record.gedcom().join('\n')));
}
