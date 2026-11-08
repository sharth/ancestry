import { describe, expect, it, vi } from "vitest";

import { parseGedcomRecords } from "../gedcom/gedcomRecord";
import {
  reportUnparsedRecord,
  warnUnparsedRecords,
} from "./record-unparsed-records";

describe("warnUnparsedRecords", () => {
  it("warns once per full path of each reported record", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
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

    warnUnparsedRecords(records);

    expect(warn.mock.calls).toEqual([
      ["Unparsed tag ", "INDI.BIRT._FOO"],
      ["Unparsed tag ", "FAM.MARR._FOO"],
      ["Unparsed tag ", "_BAR"],
    ]);
    warn.mockRestore();
  });
});
