import { assert } from "chai";
import { GedcomSubmitter } from "./gedcomSubmitter";
import { serializeGedcomSubmitter } from "./gedcomSubmitterSerializer";
import { serializeGedcomRecordToText } from "./gedcomRecordSerializer";

it("No Fields", () => {
  const gedcomSubmitter = new GedcomSubmitter("@X1@");
  assert.deepEqual(
    serializeGedcomRecordToText(serializeGedcomSubmitter(gedcomSubmitter)),
    ["0 @X1@ SUBM"]
  );
});

it("Most Fields", () => {
  const gedcomSubmitter = new GedcomSubmitter("@X1@");
  gedcomSubmitter.name = "John Doe";
  gedcomSubmitter.email = "johndoe@example.com";
  assert.deepEqual(
    serializeGedcomRecordToText(serializeGedcomSubmitter(gedcomSubmitter)),
    ["0 @X1@ SUBM", "1 NAME John Doe", "1 _EMAIL johndoe@example.com"]
  );
});
