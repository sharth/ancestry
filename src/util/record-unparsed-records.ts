import {
  gedcomRecordLineNumber,
  type GedcomRecord,
} from "../gedcom/gedcomRecord";

/** Something wrong with the loaded file, found while parsing it. */
export interface GedcomProblem {
  severity: "error" | "warning";
  message: string;
  /** The dotted tag path of the offending record, such as INDI.BIRT._FOO. */
  path: string;
  /** The xref of the top-level record it sits in, if that has one. */
  xref: string;
  /** The 1-based line of the file the offending record starts on. */
  line?: number;
}

// Records the parsers didn't understand, waiting for collectUnparsedRecords.
// A record doesn't know where it sits in the file, so its path (such as
// INDI.BIRT._FOO) is found afterwards by walking the file's records.
const unparsedRecords = new Set<GedcomRecord>();

export function reportUnparsedRecord(gedcomRecord: GedcomRecord): void {
  unparsedRecords.add(gedcomRecord);
}

// Forget any reported records, such as those left behind by a parse that threw
// partway through.
export function clearUnparsedRecords(): void {
  unparsedRecords.clear();
}

// A warning for each reported record found in gedcomRecords, in file order.
export function collectUnparsedRecords(
  gedcomRecords: GedcomRecord[],
): GedcomProblem[] {
  const problems: GedcomProblem[] = [];
  if (unparsedRecords.size == 0) return problems;
  const path: string[] = [];
  let xref = "";
  const visit = (gedcomRecord: GedcomRecord) => {
    path.push(gedcomRecord.tag);
    if (unparsedRecords.has(gedcomRecord)) {
      problems.push({
        severity: "warning",
        message: "Tag not understood by this app",
        path: path.join("."),
        xref,
        line: gedcomRecordLineNumber(gedcomRecord),
      });
    }
    gedcomRecord.children.forEach(visit);
    path.pop();
  };
  for (const gedcomRecord of gedcomRecords) {
    xref = gedcomRecord.xref;
    visit(gedcomRecord);
  }
  unparsedRecords.clear();
  return problems;
}
