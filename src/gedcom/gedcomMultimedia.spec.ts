import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
} from "./gedcomMultimedia";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomMultimedia", () => {
  const fullMultimediaRecord: GedcomRecord = {
    tag: "OBJE",
    abstag: "OBJE",
    xref: "@M1@",
    value: "",
    children: [
      {
        tag: "FILE",
        abstag: "OBJE.FILE",
        xref: "",
        value: "path/to/file.jpg",
        children: [
          {
            tag: "FORM",
            abstag: "OBJE.FILE.FORM",
            xref: "",
            value: "jpg",
            children: [],
          },
          {
            tag: "TITL",
            abstag: "OBJE.FILE.TITL",
            xref: "",
            value: "My Title",
            children: [],
          },
        ],
      },
      {
        tag: "CHAN",
        abstag: "",
        xref: "",
        value: "",
        children: [
          {
            tag: "DATE",
            abstag: "",
            xref: "",
            value: "1 JAN 2020",
            children: [],
          },
        ],
      },
    ],
  };

  const expectedMultimedia = {
    xref: "@M1@",
    filePath: "path/to/file.jpg",
    mediaType: "jpg",
    title: "My Title",
    changeDate: { date: { value: "1 JAN 2020" } },
  };

  it("parser handles full record", () => {
    expect(parseGedcomMultimedia(fullMultimediaRecord)).toEqual(
      expectedMultimedia,
    );
  });

  it("serializer handles full record", () => {
    expect(serializeGedcomMultimedia(expectedMultimedia)).toEqual(
      fullMultimediaRecord,
    );
  });

  it("parser handles minimal record", () => {
    const minimalRecord: GedcomRecord = {
      tag: "OBJE",
      abstag: "OBJE",
      xref: "@M2@",
      value: "",
      children: [],
    };
    expect(parseGedcomMultimedia(minimalRecord)).toEqual({
      xref: "@M2@",
      filePath: "",
      mediaType: "",
      title: "",
    });
  });

  it("serializer handles minimal record", () => {
    const minimalMultimedia = {
      xref: "@M2@",
      filePath: "",
      mediaType: "",
      title: "",
    };
    expect(serializeGedcomMultimedia(minimalMultimedia)).toEqual({
      tag: "OBJE",
      abstag: "OBJE",
      xref: "@M2@",
      value: "",
      children: [],
    });
  });

  describe("error conditions", () => {
    it("throws on multiple file paths", () => {
      const record: GedcomRecord = {
        tag: "OBJE",
        abstag: "OBJE",
        xref: "@M1@",
        value: "",
        children: [
          {
            tag: "FILE",
            abstag: "OBJE.FILE",
            xref: "",
            value: "p1",
            children: [],
          },
          {
            tag: "FILE",
            abstag: "OBJE.FILE",
            xref: "",
            value: "p2",
            children: [],
          },
        ],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow(
        "Multiple filePaths are not supported.",
      );
    });

    it("throws on multiple media types", () => {
      const record: GedcomRecord = {
        tag: "OBJE",
        abstag: "OBJE",
        xref: "@M1@",
        value: "",
        children: [
          {
            tag: "FILE",
            abstag: "OBJE.FILE",
            xref: "",
            value: "p1",
            children: [
              {
                tag: "FORM",
                abstag: "OBJE.FILE.FORM",
                xref: "",
                value: "jpg",
                children: [],
              },
              {
                tag: "FORM",
                abstag: "OBJE.FILE.FORM",
                xref: "",
                value: "png",
                children: [],
              },
            ],
          },
        ],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow(
        "Multiple mediaTypes are not allowed",
      );
    });

    it("throws on multiple titles", () => {
      const record: GedcomRecord = {
        tag: "OBJE",
        abstag: "OBJE",
        xref: "@M1@",
        value: "",
        children: [
          {
            tag: "FILE",
            abstag: "OBJE.FILE",
            xref: "",
            value: "p1",
            children: [
              {
                tag: "TITL",
                abstag: "OBJE.FILE.TITL",
                xref: "",
                value: "t1",
                children: [],
              },
              {
                tag: "TITL",
                abstag: "OBJE.FILE.TITL",
                xref: "",
                value: "t2",
                children: [],
              },
            ],
          },
        ],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow(
        "Multiple titles are not allowed",
      );
    });

    it("throws on multiple change dates", () => {
      const record: GedcomRecord = {
        tag: "OBJE",
        abstag: "OBJE",
        xref: "@M1@",
        value: "",
        children: [
          {
            tag: "CHAN",
            abstag: "OBJE.CHAN",
            xref: "",
            value: "",
            children: [],
          },
          {
            tag: "CHAN",
            abstag: "OBJE.CHAN",
            xref: "",
            value: "",
            children: [],
          },
        ],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow(
        "Multiple change dates are not allowed",
      );
    });

    it("throws on invalid tag", () => {
      const record: GedcomRecord = {
        tag: "INDI",
        abstag: "INDI",
        xref: "@I1@",
        value: "",
        children: [],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow();
    });

    it("throws on missing xref", () => {
      const record: GedcomRecord = {
        tag: "OBJE",
        abstag: "OBJE",
        xref: "",
        value: "",
        children: [],
      };
      expect(() => parseGedcomMultimedia(record)).toThrow();
    });
  });
});
