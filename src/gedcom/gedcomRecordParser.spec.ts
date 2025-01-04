import { parseGedcomRecords } from "./gedcomRecordParser";

it("conc is merged into the previous record", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @I1@ INDI", "1 NAME john ", "2 CONC doe", "2 CONT senior"].join("\n")
  );
  expect(gedcomRecord).toEqual({
    xref: "@I1@",
    tag: "INDI",
    abstag: "INDI",
    value: undefined,
    children: [
      {
        xref: undefined,
        tag: "NAME",
        abstag: "INDI.NAME",
        value: "john doe\nsenior",
        children: [],
      },
    ],
  });
});

it("conc onto the empty string", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG", "1 CONC value"].join("\n")
  );
  expect(gedcomRecord).toEqual({
    xref: undefined,
    tag: "TAG",
    abstag: "TAG",
    value: "value",
    children: [],
  });
});

it("cont onto the empty string", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG", "1 CONT value"].join("\n")
  );
  expect(gedcomRecord).toEqual({
    xref: undefined,
    tag: "TAG",
    abstag: "TAG",
    value: "\nvalue",
    children: [],
  });
});

it("empty lines presented correctly", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG", "1 CONC", "1 CONT", "1 CONT"].join("\n")
  );
  expect(gedcomRecord).toEqual({
    xref: undefined,
    tag: "TAG",
    abstag: "TAG",
    value: "\n\n",
    children: [],
  });
});

it("conc records disappear", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 TAG abc", "1 CONC def"].join("\n")
  );
  expect(gedcomRecord).toEqual({
    xref: undefined,
    tag: "TAG",
    abstag: "TAG",
    value: "abcdef",
    children: [],
  });
});

it("parse an empty file", () => {
  const gedcomRecords = parseGedcomRecords("");
  expect(gedcomRecords).toEqual([]);
});

it("parse a file of one newline", () => {
  const gedcomRecords = parseGedcomRecords("\r\n");
  expect(gedcomRecords).toEqual([]);
});

it("error when missing level", () => {
  expect(() => {
    parseGedcomRecords(["0 INDI", "unparsable"].join("\n"));
  }).toThrow(new Error("Failed to parse line number 2: unparsable"));
});

it("error when skipping level", () => {
  expect(() => {
    parseGedcomRecords(["0 INDI", "3 EXPR"].join("\n"));
  }).toThrow(new Error("Skipped parent level on line number 2: 3 EXPR"));
});
