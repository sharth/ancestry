import { assert, describe, expect, it } from "vitest";
import { newGedcomChangeDate } from "./gedcomChangeDate";
import { newGedcomFact } from "./gedcomFact";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import { newGedcomName } from "./gedcomName";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import { newGedcomSourceCitation } from "./gedcomSourceCitation";

describe("gedcomIndividual", () => {
  it("no fields", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });
  it("more fields", () => {
    const gedcomText = [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "2 SOUR @S1@",
      "2 SOUR @S2@",
      "1 CHAN",
      "2 DATE 1 JAN 1900",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
        changeDate: newGedcomChangeDate({ value: "1 JAN 1900" }),
        names: [
          newGedcomName({
            givenName: "John",
            surname: "Doe",
            citations: [
              newGedcomSourceCitation({ sourceXref: "@S1@" }),
              newGedcomSourceCitation({ sourceXref: "@S2@" }),
            ],
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });

  it("parse individual with name with citations", () => {
    const gedcomText = [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "2 SOUR @S1@",
      "2 SOUR @S2@",
      "3 QUAY 3",
      "2 SOUR @S3@",
      "3 PAGE page",
      "3 QUAY 3",
      "3 DATA",
      "4 TEXT text",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
        names: [
          newGedcomName({
            givenName: "John",
            surname: "Doe",
            citations: [
              newGedcomSourceCitation({
                sourceXref: "@S1@",
              }),
              newGedcomSourceCitation({
                sourceXref: "@S2@",
                quality: "3",
              }),
              newGedcomSourceCitation({
                sourceXref: "@S3@",
                text: "text",
                page: "page",
                quality: "3",
              }),
            ],
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });

  it("parse individual with only sex", () => {
    const gedcomText = [
      "0 @I3@ INDI", //
      "1 SEX F",
      "2 SOUR @S50@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I3@",
        sex: {
          sex: "F",
          citations: [
            newGedcomSourceCitation({
              sourceXref: "@S50@",
            }),
          ],
        },
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });

  it("parse individual with idno", () => {
    const gedcomText = [
      "0 @I5@ INDI", //
      "1 IDNO abcd",
      "2 TYPE familysearch.org",
      "1 BIRT",
      "2 CAUS normal",
      "2 DATE ABT 1 Jan 2000",
      "2 SDATE 1 Jan 2000",
      "2 PLAC place",
      "2 ADDR address",
      "2 SOUR @S1@",
      "1 OCCU Truck Driver",
      "2 TYPE Permanent",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I5@",
        facts: [
          newGedcomFact({
            tag: "IDNO",
            value: "abcd",
            type: "familysearch.org",
          }),
          newGedcomFact({
            tag: "BIRT",
            place: "place",
            address: "address",
            cause: "normal",
            date: { value: "ABT 1 Jan 2000" },
            sortDate: { value: "1 Jan 2000" },
            citations: [
              newGedcomSourceCitation({
                sourceXref: "@S1@",
              }),
            ],
          }),
          newGedcomFact({
            tag: "OCCU",
            value: "Truck Driver",
            type: "Permanent",
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });

  it("MARR on an individual is not a recognized fact", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
      "1 MARR",
      "2 DATE 1 JAN 2000",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual.facts).toHaveLength(0);
    expect(gedcomIndividual.unknownRecords).toHaveLength(1);
    expect(gedcomIndividual.unknownRecords[0]?.tag).toBe("MARR");
  });

  it("GRAD on an individual is a recognized fact", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
      "1 GRAD",
      "2 DATE 15 JUN 2005",
      "2 PLAC Springfield",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
        facts: [
          newGedcomFact({
            tag: "GRAD",
            date: { value: "15 JUN 2005" },
            place: "Springfield",
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });
});
