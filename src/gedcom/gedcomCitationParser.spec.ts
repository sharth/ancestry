import { assert } from "chai";
import { parseGedcomCitation } from "./gedcomCitationParser";
import { parseGedcomRecords } from "./gedcomRecordParser";

it("SimpleCitation", () => {
  const [gedcomRecord] = parseGedcomRecords(
    [
      "0 SOUR @S1@",
      "1 QUAY 3",
      "1 OBJE google.com",
      "1 NAME name",
      "1 PAGE page",
      "1 DATA",
      "2 TEXT text",
    ].join("\n")
  );
  const gedcomCitation = parseGedcomCitation(gedcomRecord);
  assert.deepEqual(
    { ...gedcomCitation },
    {
      sourceXref: "@S1@",
      name: "name",
      obje: "google.com",
      text: "text",
      page: "page",
      quality: "3",
    }
  );
});

it("Support empty citation reason", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 SOUR @S1@", "1 DATA", "2 TEXT"].join("\n")
  );
  const gedcomCitation = parseGedcomCitation(gedcomRecord);
  assert.deepEqual({ ...gedcomCitation }, { sourceXref: "@S1@" });
});
