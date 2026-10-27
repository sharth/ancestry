import { describe, expect, it } from "vitest";

import {
  parseGedcomDatabase,
  serializeGedcomDatabase,
  type GedcomDatabase,
} from "./gedcomDatabase";
import { newGedcomFamily, type GedcomFamily } from "./gedcomFamily";
import { parseGedcomRecords } from "./gedcomRecord";

const gedcomText = [
  "0 HEAD",
  "1 GEDC",
  "2 VERS 5.5.1",
  "0 @I1@ INDI",
  "1 FAMS @F1@",
  "0 @I2@ INDI",
  "0 @I3@ INDI",
  "1 FAMC @F1@",
  "0 @F1@ FAM",
  "1 HUSB @I1@",
  "1 CHIL @I3@",
  "0 TRLR",
].join("\n");

function loadDatabase() {
  const gedcomRecords = parseGedcomRecords(gedcomText);
  return { gedcomRecords, database: parseGedcomDatabase(gedcomRecords) };
}

// The family from the file, with some of its fields edited.
function family(fieldsToUpdate: Partial<GedcomFamily>) {
  return newGedcomFamily({
    xref: "@F1@",
    husbandXref: "@I1@",
    childXrefs: ["@I3@"],
    ...fieldsToUpdate,
  });
}

// Saves the database and loads it back, the way the editor does.
function saveAndReload(
  gedcomRecords: ReturnType<typeof parseGedcomRecords>,
  database: GedcomDatabase,
) {
  const savedText = serializeGedcomDatabase(gedcomRecords, database).join("\n");
  return parseGedcomDatabase(parseGedcomRecords(savedText));
}

describe("serializeGedcomDatabase family links", () => {
  it("adds FAMS to a spouse added to a family", () => {
    const { gedcomRecords, database } = loadDatabase();
    database.families["@F1@"] = family({ wifeXref: "@I2@" });

    const reloaded = saveAndReload(gedcomRecords, database);

    expect(reloaded.individuals["@I2@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
  });

  it("removes FAMS from a spouse replaced in a family", () => {
    const { gedcomRecords, database } = loadDatabase();
    database.families["@F1@"] = family({ husbandXref: "@I2@" });

    const reloaded = saveAndReload(gedcomRecords, database);

    expect(reloaded.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(reloaded.individuals["@I2@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
  });

  it("adds and removes FAMC as children change", () => {
    const { gedcomRecords, database } = loadDatabase();
    database.families["@F1@"] = family({ childXrefs: ["@I2@"] });

    const reloaded = saveAndReload(gedcomRecords, database);

    expect(reloaded.individuals["@I2@"]?.childOfFamilyXrefs).toEqual(["@F1@"]);
    expect(reloaded.individuals["@I3@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("leaves an already consistent database unchanged", () => {
    const { gedcomRecords, database } = loadDatabase();

    const reloaded = saveAndReload(gedcomRecords, database);

    expect(reloaded.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
    expect(reloaded.individuals["@I3@"]?.childOfFamilyXrefs).toEqual(["@F1@"]);
  });
});
