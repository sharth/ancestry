import type { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomRecordToText } from "./gedcomRecordSerializer";

it("GedcomRecord", () => {
  const gedcomRecord: GedcomRecord = {
    xref: "@I1@",
    tag: "INDI",
    abstag: "INDI",
    children: [
      {
        tag: "NAME",
        abstag: "INDI.NAME",
        value: "john doe \n senior",
        children: [],
      },
    ],
  };
  expect(serializeGedcomRecordToText(gedcomRecord)).toEqual([
    "0 @I1@ INDI",
    "1 NAME john doe ",
    "2 CONT  senior",
  ]);
});
