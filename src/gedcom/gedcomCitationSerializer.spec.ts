import type { GedcomCitation } from "./gedcomCitation";
import { serializeGedcomCitation } from "./gedcomCitationSerializer";
import { serializeGedcomRecordToText } from "./gedcomRecordSerializer";

it("GedcomCitation", () => {
  const gedcomCitation: GedcomCitation = { sourceXref: "@S1@" };
  expect(
    serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation))
  ).toEqual(["0 SOUR @S1@"]);

  gedcomCitation.quality = "3";
  expect(
    serializeGedcomRecordToText(serializeGedcomCitation(gedcomCitation))
  ).toEqual(["0 SOUR @S1@", "1 QUAY 3"]);
});
