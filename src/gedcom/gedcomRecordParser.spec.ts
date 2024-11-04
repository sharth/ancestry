import { assert } from "chai";
import { parseGedcomRecords } from "./gedcomRecordParser";
import { GedcomRecord } from ".";

it("conc is merged into the previous record", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @I1@ INDI", "1 NAME john ", "2 CONC doe", "2 CONT senior"].join("\n")
  );
  assert.deepEqual(
    gedcomRecord,
    new GedcomRecord("@I1@", "INDI", "INDI", undefined, [
      new GedcomRecord(undefined, "NAME", "INDI.NAME", "john doe\nsenior", []),
    ])
  );
});

it("conc onto the empty string", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG", "1 CONC value"].join("\n")
  );
  assert.deepEqual(
    gedcomRecord,
    new GedcomRecord(undefined, "TAG", "TAG", "value", [])
  );
});

it("cont onto the empty string", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG", "1 CONT value"].join("\n")
  );
  assert.deepEqual(
    gedcomRecord,
    new GedcomRecord(undefined, "TAG", "TAG", "\nvalue", [])
  );
});

it("empty lines presented correctly", () => {
  const gedcomRecords = parseGedcomRecords(
    ["0 TAG", "1 CONC", "1 CONT", "1 CONT"].join("\n")
  );
  assert.deepEqual(gedcomRecords, [
    new GedcomRecord(undefined, "TAG", "TAG", "\n\n", []),
  ]);
});

it("conc records disappear", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG abc", "1 CONC def"].join("\n")
  );
  assert.deepEqual(
    gedcomRecord,
    new GedcomRecord(undefined, "TAG", "TAG", "abcdef", [])
  );
});

it("parse an empty file", () => {
  const gedcomRecords = parseGedcomRecords("");
  assert.deepEqual(gedcomRecords, []);
});

it("parse a file of one newline", () => {
  const gedcomRecords = parseGedcomRecords("\r\n");
  assert.deepEqual(gedcomRecords, []);
});

it("error when missing level", () => {
  assert.throws(() => {
    parseGedcomRecords(["0 INDI", "unparsable"].join("\n"));
  }, "Failed to parse line number 2: unparsable");
});

it("error when skipping level", () => {
  assert.throws(() => {
    parseGedcomRecords(["0 INDI", "3 EXPR"].join("\n"));
  }, "Skipped parent level on line number 2: 3 EXPR");
});
