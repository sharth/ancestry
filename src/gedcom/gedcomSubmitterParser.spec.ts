import { parseGedcomRecords } from "./gedcomRecordParser";
import { parseGedcomSubmitter } from "./gedcomSubmitterParser";

it("No Fields", () => {
  const [gedcomRecord] = parseGedcomRecords(["0 @X1@ SUBM"].join("\n"));
  const gedcomSubmitter = parseGedcomSubmitter(gedcomRecord);
  expect({ ...gedcomSubmitter }).toEqual({
    xref: "@X1@",
  });
});

it("Most Fields", () => {
  const [gedcomRecord] = parseGedcomRecords(
    ["0 @X1@ SUBM", "1 NAME John Doe", "1 _EMAIL johndoe@example.com"].join(
      "\n"
    )
  );
  const gedcomSubmitter = parseGedcomSubmitter(gedcomRecord);
  expect({ ...gedcomSubmitter }).toEqual({
    xref: "@X1@",
    name: "John Doe",
    email: "johndoe@example.com",
  });
});
