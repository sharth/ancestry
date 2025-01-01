import { parseGedcomRecords } from "./gedcomRecordParser";
import { parseGedcomFamily } from "./gedcomFamilyParser";

it("No Parents", () => {
  const [gedcomRecord] = parseGedcomRecords(["0 @F1@ FAM"].join("\n"));
  const gedcomFamily = parseGedcomFamily(gedcomRecord);
  expect({
    ...gedcomFamily,
    gedcomRecord: undefined,
  }).toEqual({
    xref: "@F1@",
    childXrefs: [],
    events: [],
    gedcomRecord: undefined,
  });
});

it("Parents", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @F3@ FAM", "1 WIFE @I2@", "1 HUSB @I3@"].join("\n")
  );
  const gedcomFamily = parseGedcomFamily(gedcomRecord);
  expect({
    ...gedcomFamily,
    gedcomRecord: undefined,
  }).toEqual({
    xref: "@F3@",
    wifeXref: "@I2@",
    husbandXref: "@I3@",
    childXrefs: [],
    events: [],
    gedcomRecord: undefined,
  });
});
