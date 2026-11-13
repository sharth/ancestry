import { describe, expect, it } from "vitest";

import { parseGedcomRecords } from "../gedcom/gedcomRecord";
import {
  clearUnparsedRecords,
  collectUnparsedRecords,
  reportUnparsedRecord,
} from "./record-unparsed-records";

describe("collectUnparsedRecords", () => {
  it("warns about each reported record, with its path, xref and line", () => {
    const records = parseGedcomRecords(
      [
        "0 @I1@ INDI",
        "1 BIRT",
        "2 _FOO a",
        "0 @I2@ INDI",
        "1 BIRT",
        "2 _FOO b",
        "0 @F1@ FAM",
        "1 MARR",
        "2 _FOO c",
        "0 _BAR",
      ].join("\n"),
    );
    for (const record of records) {
      if (record.tag == "_BAR") reportUnparsedRecord(record);
      for (const fact of record.children) {
        fact.children.forEach(reportUnparsedRecord);
      }
    }

    const problems = collectUnparsedRecords(records);

    expect(
      problems.map(({ severity, path, xref, line }) => ({
        severity,
        path,
        xref,
        line,
      })),
    ).toEqual([
      { severity: "warning", path: "INDI.BIRT._FOO", xref: "@I1@", line: 3 },
      { severity: "warning", path: "INDI.BIRT._FOO", xref: "@I2@", line: 6 },
      { severity: "warning", path: "FAM.MARR._FOO", xref: "@F1@", line: 9 },
      { severity: "warning", path: "_BAR", xref: "", line: 10 },
    ]);
    expect(collectUnparsedRecords(records)).toEqual([]);
  });

  it("forgets records reported before a clear", () => {
    const records = parseGedcomRecords("0 _BAR");
    records.forEach(reportUnparsedRecord);

    clearUnparsedRecords();

    expect(collectUnparsedRecords(records)).toEqual([]);
  });
});
