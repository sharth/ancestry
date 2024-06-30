import {Component, computed, inject} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {parseGedcomRecordsFromText} from '../../gedcom/gedcomRecord';

@Component({
  selector: 'app-gedcom',
  standalone: true,
  imports: [],
  templateUrl: './gedcom.component.html',
  styleUrl: './gedcom.component.css',
})
export class GedcomComponent {
  ancestryService = inject(AncestryService);

  differences = computed(() => {
    const oldGedcomText = Array.from(parseGedcomRecordsFromText(this.ancestryService.originalGedcomText()))
        .map((record) => record.text().join('\n'));
    const newGedcomText = this.ancestryService.gedcomRecords()
        .map((record) => record.text().join('\n'));

    const differences = [];
    let oldGedcomIndex = 0;
    let newGedcomIndex = 0;
    while (newGedcomIndex < newGedcomText.length) {
      if (oldGedcomText[oldGedcomIndex] == newGedcomText[newGedcomIndex]) {
        oldGedcomIndex += 1;
        newGedcomIndex += 1;
      } else if (oldGedcomText.includes(newGedcomText[newGedcomIndex], oldGedcomIndex)) {
        differences.push({oldText: oldGedcomText[oldGedcomIndex], newText: ''});
        oldGedcomIndex += 1;
      } else {
        differences.push({oldText: '', newText: newGedcomText[newGedcomIndex]});
        newGedcomIndex += 1;
      }
    }
    while (oldGedcomIndex < oldGedcomText.length) {
      differences.push({oldText: oldGedcomText[oldGedcomIndex], newText: ''});
      oldGedcomIndex += 1;
    }
    return differences;
  });
}
