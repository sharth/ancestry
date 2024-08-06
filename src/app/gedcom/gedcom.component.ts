import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {parseGedcomRecordsFromText} from '../../gedcom/gedcomRecord.parser';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';

@Component({
  selector: 'app-gedcom',
  standalone: true,
  imports: [],
  templateUrl: './gedcom.component.html',
  styleUrl: './gedcom.component.css',
})
export class GedcomComponent {
  readonly ancestryService = ancestryService;

  differences = computed(() => {
    const oldGedcomText = Array.from(parseGedcomRecordsFromText(ancestryService.originalGedcomText()))
        .map(serializeGedcomRecordToText);
    const newGedcomText = this.ancestryService.gedcomRecords()
        .map(serializeGedcomRecordToText);

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
