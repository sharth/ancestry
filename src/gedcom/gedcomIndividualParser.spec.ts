import { parseGedcomRecords } from "./gedcomRecordParser";
import { parseGedcomIndividual } from "./gedcomIndividualParser";

it("No Fields", () => {
  const [gedcomRecord] = parseGedcomRecords(["0 @I1@ INDI"].join("\n"));
  const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
  expect({
    ...gedcomIndividual,
    gedcomRecord: undefined,
  }).toEqual({
    xref: "@I1@",
    events: [],
    gedcomRecord: undefined,
  });
});

it("Male", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @I1@ INDI", "1 SEX M"].join("\n")
  );
  const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
  expect({
    ...gedcomIndividual,
    events: gedcomIndividual.events.map((event) => ({ ...event })),
    gedcomRecord: undefined,
  }).toEqual({
    xref: "@I1@",
    sex: "Male",
    events: [{ type: "Sex", citations: [], sharedWithXrefs: [], value: "M" }],
    gedcomRecord: undefined,
  });
});

it("Female", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @I1@ INDI", "1 SEX F"].join("\n")
  );
  const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
  expect({
    ...gedcomIndividual,
    events: gedcomIndividual.events.map((event) => ({ ...event })),

    gedcomRecord: undefined,
  }).toEqual({
    xref: "@I1@",
    sex: "Female",
    events: [{ type: "Sex", citations: [], sharedWithXrefs: [], value: "F" }],
    gedcomRecord: undefined,
  });
});

it("Family Search Id", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @I4@ INDI", "1 _FSFTID abcd"].join("\n")
  );
  const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
  expect({
    ...gedcomIndividual,
    gedcomRecord: undefined,
  }).toEqual({
    xref: "@I4@",
    familySearchId: "abcd",
    events: [],
    gedcomRecord: undefined,
  });
});
