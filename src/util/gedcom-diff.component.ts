import {Component, computed, input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-gedcom-diff',
  standalone: true,
  templateUrl: './gedcom-diff.component.html',
  styleUrl: './gedcom-diff.component.css',
  imports: [CommonModule],
})
export class GedcomDiffComponent {
  readonly newGedcomText = input.required<string>();
  readonly oldGedcomText = input.required<string>();
  readonly differences = computed(() => {
    const oldGedcomArr = this.oldGedcomText().split(/\r?\n/);
    const newGedcomArr = this.newGedcomText().split(/\r?\n/);
    const diffs = [];
    let i = 0, j = 0;
    while (i < oldGedcomArr.length && j < newGedcomArr.length) {
      if (i < 100 && j < 100) {
        console.log(i, j, oldGedcomArr[i], newGedcomArr[j]);
      }
      if (oldGedcomArr[i] == newGedcomArr[i]) {
        diffs.push({oldLine: oldGedcomArr[i], oldColor: 'lightgray', newLine: newGedcomArr[j], newColor: 'lightgray'});
        i += 1;
        j += 1;
      } else if (newGedcomArr.includes(oldGedcomArr[i], j)) {
        while (oldGedcomArr[i] != newGedcomArr[j]) {
          diffs.push({oldLine: '', oldColor: 'lightgray', newLine: newGedcomArr[j], newColor: 'lightgreen'});
          j += 1;
        }
      } else {
        diffs.push({oldLine: oldGedcomArr[i], oldColor: 'lightcoral', newLine: '', newColor: 'lightgray'});
        i += 1;
      }
    }
    while (i < oldGedcomArr.length) {
        diffs.push({oldLine: oldGedcomArr[i], oldColor: 'lightcoral', newLine: '', newColor: 'lightgray'});
        i += 1;
    }
    while (j < newGedcomArr.length) {
        diffs.push({oldLine: '', oldColor: 'lightgray', newLine: newGedcomArr[j], newColor: 'lightgreen'});
        j += 1;
    }
    return diffs;
  })
}
