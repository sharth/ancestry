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
    const oldGedcomArr = this.oldGedcomText().split("\n");
    const newGedcomArr = this.newGedcomText().split("\n");
    const diffs = [];
    let i = 0, j = 0;
    while (i < oldGedcomArr.length && j < newGedcomArr.length) {
        const nextJ = newGedcomArr.findIndex((value) => value == oldGedcomArr[i]);
        if (nextJ == -1) {
            diffs.push({oldLine: oldGedcomArr[i], oldColor: 'red', newLine: '', newColor: 'gray'});
            i += 1;
        } else {
            while (j < nextJ) {
                diffs.push({oldLine: '', oldColor: 'gray', newLine: newGedcomArr[j], newColor: 'lightgreen'});
                j += 1;
            }
            diffs.push({oldLine: oldGedcomArr[i], oldColor: 'gray', newLine: newGedcomArr[j], newColor: 'gray'});
            i += 1;
            j += 1;
        }
    }
    while (i < oldGedcomArr.length) {
        diffs.push({oldLine: oldGedcomArr[i], oldColor: 'red', newLine: '', newColor: 'gray'});
        i += 1;
    }
    while (j < newGedcomArr.length) {
        diffs.push({oldLine: '', oldColor: 'gray', newLine: newGedcomArr[j], newColor: 'lightgreen'});
        j += 1;
    }
    return diffs;
  })
}
