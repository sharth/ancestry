import { describe, expect, it } from "vitest";

import {
  multimediaFileName,
  multimediaFilePathProblem,
  sanitizeFileName,
} from "./multimedia-file-name";

describe("multimediaFileName", () => {
  it("joins xref and title and keeps the extension", () => {
    expect(multimediaFileName("@O12@", "1901 Census", "IMG_0042.JPG")).toBe(
      "O12 1901 Census.jpg",
    );
  });

  it("drops characters that aren't allowed in file names", () => {
    expect(
      multimediaFileName("O1", 'Letter: "Dear Mum" 1/2 <draft>?', "scan.png"),
    ).toBe("O1 Letter Dear Mum 12 draft.png");
  });

  it("collapses whitespace and trims trailing dots", () => {
    expect(multimediaFileName("O1", "  Smith\n family  ...", "a.pdf")).toBe(
      "O1 Smith family.pdf",
    );
  });

  it("uses only the xref when there's no title", () => {
    expect(multimediaFileName("O7", "", "photo.png")).toBe("O7.png");
  });

  it("handles a file without an extension", () => {
    expect(multimediaFileName("O7", "Deed", "README")).toBe("O7 Deed");
    expect(multimediaFileName("O7", "Deed", ".hidden")).toBe("O7 Deed");
  });

  it("falls back to a generic name when nothing usable is left", () => {
    expect(multimediaFileName("", "???", "a.png")).toBe("multimedia.png");
  });
});

describe("sanitizeFileName", () => {
  it("keeps a valid name as is", () => {
    expect(sanitizeFileName("O1 Deed.png")).toBe("O1 Deed.png");
  });

  it("drops invalid characters and trims", () => {
    expect(sanitizeFileName(" a/b:c?.png. ")).toBe("abc.png");
  });

  it("can return an empty name", () => {
    expect(sanitizeFileName(" ... ")).toBe("");
  });
});

describe("multimediaFilePathProblem", () => {
  it("accepts a file name or a relative path", () => {
    expect(multimediaFilePathProblem("O1 Deed.png")).toBeUndefined();
    expect(multimediaFilePathProblem("scans/O1 Deed.png")).toBeUndefined();
  });

  it("rejects an empty name or path part", () => {
    expect(multimediaFilePathProblem("")).toBe("Enter a file name.");
    expect(multimediaFilePathProblem("scans/")).toBe("Enter a file name.");
  });

  it("rejects characters that aren't allowed in file names", () => {
    expect(multimediaFilePathProblem("Deed?.png")).toMatch(/can't contain/);
    expect(multimediaFilePathProblem("Deed.")).toMatch(/can't contain/);
  });
});
