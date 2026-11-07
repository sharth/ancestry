import { describe, expect, it } from "vitest";

import { newGedcomMultimedia } from "./gedcomMultimedia";
import {
  multimediaLinkTitle,
  newGedcomMultimediaLink,
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import type { GedcomRecord } from "./gedcomRecord";

describe("gedcomMultimediaLink", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "OBJE",
    abstag: "",
    xref: "",
    value: "@M1@",
    children: [],
  };
  it("parser", () => {
    expect(parseGedcomMultimediaLink(gedcomRecord)).toEqual({
      xref: "@M1@",
      title: "",
    });
  });
  it("serializer", () => {
    expect(
      serializeGedcomMultimediaLink(parseGedcomMultimediaLink(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  const gedcomRecordWithCrop: GedcomRecord = {
    tag: "OBJE",
    abstag: "",
    xref: "",
    value: "@M1@",
    children: [
      {
        tag: "CROP",
        abstag: "",
        xref: "",
        value: "",
        children: [
          { tag: "TOP", abstag: "", xref: "", value: "10", children: [] },
          { tag: "LEFT", abstag: "", xref: "", value: "20", children: [] },
          { tag: "HEIGHT", abstag: "", xref: "", value: "30", children: [] },
          { tag: "WIDTH", abstag: "", xref: "", value: "40", children: [] },
        ],
      },
      { tag: "TITL", abstag: "", xref: "", value: "A crop", children: [] },
    ],
  };
  it("parser with crop", () => {
    expect(parseGedcomMultimediaLink(gedcomRecordWithCrop)).toEqual({
      xref: "@M1@",
      title: "A crop",
      crop: { top: 10, left: 20, height: 30, width: 40 },
    });
  });
  it("serializer with crop", () => {
    expect(
      serializeGedcomMultimediaLink(
        parseGedcomMultimediaLink(gedcomRecordWithCrop),
      ),
    ).toEqual(gedcomRecordWithCrop);
  });
});

describe("multimediaLinkTitle", () => {
  const multimedia = newGedcomMultimedia({
    xref: "@M1@",
    title: "Census page 12",
    filePath: "census/1910/page-12.png",
  });

  it("prefers the link's own title", () => {
    expect(
      multimediaLinkTitle(
        newGedcomMultimediaLink({ xref: "@M1@", title: "Hale household" }),
        multimedia,
      ),
    ).toBe("Hale household");
  });

  it("falls back to the multimedia record's title", () => {
    expect(
      multimediaLinkTitle(
        newGedcomMultimediaLink({ xref: "@M1@" }),
        multimedia,
      ),
    ).toBe("Census page 12");
  });

  it("falls back to the file name, then the xref", () => {
    const link = newGedcomMultimediaLink({ xref: "@M1@" });
    expect(multimediaLinkTitle(link, { ...multimedia, title: "" })).toBe(
      "page-12.png",
    );
    expect(
      multimediaLinkTitle(link, {
        ...multimedia,
        title: "",
        filePath: "C:\\scans\\page-12.png",
      }),
    ).toBe("page-12.png");
    expect(multimediaLinkTitle(link, undefined)).toBe("@M1@");
  });
});
