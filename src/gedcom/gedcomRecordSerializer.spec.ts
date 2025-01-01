import { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomRecordToText } from "./gedcomRecordSerializer";

it("GedcomRecord", () => {
  const gedcomRecord = new GedcomRecord("@I1@", "INDI", "INDI", undefined, [
    new GedcomRecord(undefined, "NAME", "INDI.NAME", "john doe \n senior", []),
  ]);
  expect(serializeGedcomRecordToText(gedcomRecord)).toEqual([
    "0 @I1@ INDI",
    "1 NAME john doe ",
    "2 CONT  senior",
  ]);
});
