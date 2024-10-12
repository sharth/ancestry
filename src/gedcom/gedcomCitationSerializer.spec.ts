import { assert } from "chai";
import { GedcomCitation } from "./gedcomCitation";
import { serializeGedcomCitation } from "./gedcomCitationSerializer";
import { serializeGedcomRecordToText } from "./gedcomRecordSerializer";

it("GedcomCitation", () => {
  const gedcomCitation = new GedcomCitation("@S1@");
  assert.deepEqual(
    serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation)),
    ["0 SOUR @S1@"]
  );

  gedcomCitation.quality = "3";
  assert.deepEqual(
    serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation)),
    ["0 SOUR @S1@", "1 QUAY 3"]
  );
});
