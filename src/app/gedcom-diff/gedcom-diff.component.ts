import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { Component, computed, input } from "@angular/core";

@Component({
  selector: "app-gedcom-diff",
  templateUrl: "./gedcom-diff.component.html",
  styleUrl: "./gedcom-diff.component.css",
  imports: [],
})
export class GedcomDiffComponent {
  readonly newGedcomRecord = input.required<GedcomRecord | undefined>();
  readonly oldGedcomRecord = input.required<GedcomRecord | undefined>();

  readonly newGedcomText = computed<string[]>(() => {
    const gedcomRecord = this.newGedcomRecord();
    if (gedcomRecord == null) return [];
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly oldGedcomText = computed<string[]>(() => {
    const gedcomRecord = this.oldGedcomRecord();
    if (gedcomRecord == null) return [];
    return serializeGedcomRecordToText(gedcomRecord);
  });

  readonly differences = computed<Difference[]>(() => {
    const oldGedcomArr = this.oldGedcomText();
    const newGedcomArr = this.newGedcomText();
    return diff(oldGedcomArr, newGedcomArr);
  });
}

class ArrayView<T> {
  constructor(
    private _arr: T[],
    private _offset = 0,
    private _length = _arr.length,
  ) {}

  public get length(): number {
    return this._length;
  }

  public front(): T | undefined {
    if (this._length == 0) {
      return undefined;
    } else {
      return this._arr[this._offset];
    }
  }

  public popFront(): T | undefined {
    if (this._length == 0) {
      return undefined;
    } else {
      const front = this.front();
      this._offset += 1;
      this._length -= 1;
      return front;
    }
  }

  public back(): T | undefined {
    if (this._length == 0) {
      return undefined;
    } else {
      return this._arr[this._offset + this._length - 1];
    }
  }

  public popBack(): T | undefined {
    if (this._length == 0) {
      return undefined;
    } else {
      const back = this.back();
      this._length -= 1;
      return back;
    }
  }

  public slice(start: number, end: number = this._length - 1): ArrayView<T> {
    const offset = this._offset + start;
    const length = end - start + 1;
    return new ArrayView<T>(this._arr, offset, length);
  }

  public removePrefix(n: number) {
    this._offset += n;
    this._length -= n;
  }

  public removeSuffix(n: number) {
    this._length -= n;
  }

  public get(index: number): T | undefined {
    if (index < 0) {
      index = this._length + index;
    }
    if (index < 0 || index >= this._length) {
      return undefined;
    } else {
      return this._arr[this._offset + index];
    }
  }

  public forEach(
    callback: (element: T, index: number, arrayView: ArrayView<T>) => void,
  ): void {
    for (let i = 0; i < this._length; i++) {
      callback(this._arr[this._offset + i]!, i, this);
    }
  }
}

interface Difference {
  lhs?: string;
  rhs?: string;
  identical: boolean;
}

function diff(lhs: string[], rhs: string[]): Difference[] {
  return diffArrayViews(new ArrayView(lhs), new ArrayView(rhs));
}

function diffArrayViews(
  lhs: ArrayView<string>,
  rhs: ArrayView<string>,
): Difference[] {
  // Find any matching prefix.
  let prefixLength = 0;
  while (
    prefixLength < lhs.length &&
    prefixLength < rhs.length &&
    lhs.get(prefixLength) == rhs.get(prefixLength)
  ) {
    prefixLength += 1;
  }
  const lhsPrefix = lhs.slice(0, prefixLength - 1);
  const rhsPrefix = rhs.slice(0, prefixLength - 1);
  lhs.removePrefix(prefixLength);
  rhs.removePrefix(prefixLength);

  // Find any matching suffix.
  let suffixLength = 0;
  while (
    suffixLength < lhs.length &&
    suffixLength < rhs.length &&
    lhs.get(-1 - suffixLength) == rhs.get(-1 - suffixLength)
  ) {
    suffixLength += 1;
  }
  const lhsSuffix = lhs.slice(lhs.length - suffixLength);
  const rhsSuffix = rhs.slice(rhs.length - suffixLength);
  lhs.removeSuffix(suffixLength);
  rhs.removeSuffix(suffixLength);

  // Find unique strings common to both inputs.
  const commonStrings = new Map<string, [number, number]>();
  lhs.forEach((line, lhsIndex) => {
    commonStrings.set(line, [lhsIndex, -1]);
  });
  lhs.forEach((line, lhsIndex) => {
    const commonString = commonStrings.get(line);
    if (commonString !== undefined && commonString[0] != lhsIndex) {
      commonStrings.delete(line);
    }
  });
  rhs.forEach((line, rhsIndex) => {
    const commonString = commonStrings.get(line);
    if (commonString != undefined) {
      commonString[1] = rhsIndex;
    }
  });
  rhs.forEach((line, rhsIndex) => {
    const commonString = commonStrings.get(line);
    if (commonString !== undefined && commonString[1] != rhsIndex) {
      commonStrings.delete(line);
    }
  });
  commonStrings.forEach(([lhsIndex, rhsIndex], line) => {
    if (lhsIndex == -1 || rhsIndex == -1) {
      commonStrings.delete(line);
    }
  });

  // Construct a jagged array of the common strings.
  interface JaggedEntry {
    lhsIndex: number;
    rhsIndex: number;
    previousEntry?: JaggedEntry;
  }
  const jaggedArray: JaggedEntry[][] = [];
  for (const [lhsIndex, rhsIndex] of commonStrings.values()) {
    let i = 0;
    while (jaggedArray[i] && jaggedArray[i]!.at(-1)!.rhsIndex < rhsIndex) {
      i += 1;
    }
    if (i == jaggedArray.length) {
      jaggedArray.push([]);
    }
    jaggedArray[i]!.push({
      lhsIndex,
      rhsIndex,
      previousEntry: i == 0 ? undefined : jaggedArray[i - 1]!.at(-1)!,
    });
  }

  // Construct a longest common subsequence.
  const lcs: JaggedEntry[] = [];
  if (jaggedArray.length) {
    lcs.push(jaggedArray.at(-1)!.at(-1)!);
    while (true) {
      const previousEntry = lcs.at(-1)!.previousEntry;
      if (previousEntry == undefined) {
        break;
      }
      lcs.push(previousEntry);
    }
    lcs.reverse();
  }

  // Move the prefix into the differences array.
  const differences: Difference[] = [];
  for (let i = 0; i < lhsPrefix.length; i++) {
    differences.push({
      lhs: lhsPrefix.get(i),
      rhs: rhsPrefix.get(i),
      identical: true,
    });
  }

  if (lcs.length == 0) {
    // Nothing matches, create diffs for all rows in the two views.
    for (let i = 0; i < Math.max(lhs.length, rhs.length); i++) {
      differences.push({
        lhs: lhs.get(i),
        rhs: rhs.get(i),
        identical: false,
      });
    }
  } else {
    const chunks = [
      { lhsIndex: 0, rhsIndex: 0 },
      ...lcs,
      { lhsIndex: lhs.length, rhsIndex: rhs.length },
    ];
    for (let i = 1; i < chunks.length; i++) {
      differences.push(
        ...diffArrayViews(
          lhs.slice(chunks[i - 1]!.lhsIndex, chunks[i]!.lhsIndex - 1),
          rhs.slice(chunks[i - 1]!.rhsIndex, chunks[i]!.rhsIndex - 1),
        ),
      );
    }
  }

  // Move the suffix into the differences array.
  for (let i = 0; i < lhsSuffix.length; i++) {
    differences.push({
      lhs: lhsSuffix.get(i),
      rhs: rhsSuffix.get(i),
      identical: true,
    });
  }

  return differences;
}
