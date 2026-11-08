import { produce } from "immer";
import { describe, expect, it } from "vitest";

import {
  compareGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabaseRecords,
} from "./gedcomDatabase";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import { newGedcomRepository } from "./gedcomRepository";

describe("compareGedcomDatabase with serializeGedcomDatabaseRecords", () => {
  // @S2@ lists TEXT before TITL, the reverse of the order the app writes,
  // so its serialization differs from the file.
  const originalGedcomRecords = parseGedcomRecords(
    [
      "0 HEAD",
      "1 GEDC",
      "2 VERS 7.0.14",
      "0 @S1@ SOUR",
      "1 TITL First",
      "0 @S2@ SOUR",
      "1 TEXT Out of order",
      "1 TITL Second",
      "0 TRLR",
    ].join("\n"),
  );
  const originalDatabase = parseGedcomDatabase(originalGedcomRecords);
  const serializations = serializeGedcomDatabaseRecords(
    originalGedcomRecords,
    originalDatabase,
  );

  function texts(differences: ReturnType<typeof compareGedcomDatabase>) {
    return differences
      .filter(({ updatedGedcomRecord }) => updatedGedcomRecord?.tag !== "HEAD")
      .map(({ originalGedcomRecord, updatedGedcomRecord }) =>
        [originalGedcomRecord, updatedGedcomRecord].map((record) =>
          record === undefined
            ? undefined
            : serializeGedcomRecordToText(record).join("\n"),
        ),
      );
  }

  it("stores the file's own record for a record that round-trips exactly", () => {
    expect(serializations.get(originalDatabase.sources["@S1@"])).toBe(
      originalGedcomRecords[1],
    );
    expect(serializations.get(originalDatabase.sources["@S2@"])).not.toBe(
      originalGedcomRecords[2],
    );
  });

  it("gives the same comparison as serializing every record", () => {
    const updated = produce(originalDatabase, (draft) => {
      const source = draft.sources["@S1@"];
      if (source) source.title = "Retitled";
      draft.repositories["@R1@"] = newGedcomRepository({
        xref: "@R1@",
        name: "Library",
      });
    });

    expect(
      texts(
        compareGedcomDatabase(originalGedcomRecords, updated, serializations),
      ),
    ).toEqual(texts(compareGedcomDatabase(originalGedcomRecords, updated)));
  });

  it("pairs an untouched, exactly round-tripping record with itself", () => {
    const differences = compareGedcomDatabase(
      originalGedcomRecords,
      originalDatabase,
      serializations,
    );
    const s1 = differences.find((d) => d.originalGedcomRecord?.xref === "@S1@");
    expect(s1?.updatedGedcomRecord).toBe(s1?.originalGedcomRecord);
  });
});
