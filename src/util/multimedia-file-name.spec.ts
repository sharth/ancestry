import { describe, expect, it } from "vitest";

import { multimediaFileName, uniqueFileName } from "./multimedia-file-name";

describe("multimediaFileName", () => {
  it("joins xref and title and keeps the extension", () => {
    expect(multimediaFileName("O12", "1901 Census", "IMG_0042.JPG")).toBe(
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

describe("uniqueFileName", () => {
  it("keeps a name that isn't taken", () => {
    expect(uniqueFileName("O1 Deed.png", new Set(["other.png"]))).toBe(
      "O1 Deed.png",
    );
  });

  it("numbers a name that is taken", () => {
    expect(
      uniqueFileName(
        "O1 Deed.png",
        new Set(["O1 Deed.png", "O1 Deed (2).png"]),
      ),
    ).toBe("O1 Deed (3).png");
  });

  it("numbers a name without an extension", () => {
    expect(uniqueFileName("O1", new Set(["O1"]))).toBe("O1 (2)");
  });
});
