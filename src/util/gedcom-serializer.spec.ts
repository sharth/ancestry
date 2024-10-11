import { assert } from "chai";
import {
  serializeGedcomCitation,
  serializeGedcomRecordToText,
} from "./gedcom-serializer";
import { GedcomCitation, GedcomRecord } from "../gedcom";

describe("Serialize", () => {
  it("GedcomRecord", () => {
    const gedcomRecord = new GedcomRecord("@I1@", "INDI", "INDI", undefined, [
      new GedcomRecord(
        undefined,
        "NAME",
        "INDI.NAME",
        "john doe \n senior",
        []
      ),
    ]);
    assert.deepEqual(serializeGedcomRecordToText(gedcomRecord), [
      "0 @I1@ INDI",
      "1 NAME john doe ",
      "2 CONT  senior",
    ]);
  });

  it("GedcomCitation", () => {
    const gedcomCitation = new GedcomCitation("@S1@");
    assert.deepEqual(
      serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation), 5),
      ["5 SOUR @S1@"]
    );
    gedcomCitation.quality = "3";
    assert.deepEqual(
      serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation), 5),
      ["5 SOUR @S1@", "6 QUAY 3"]
    );
  });
});
