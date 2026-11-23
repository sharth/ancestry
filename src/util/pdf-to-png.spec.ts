import { describe, expect, it } from "vitest";

import { pdfPageCount, pdfPageToPng } from "./pdf-to-png";
import { testPdf } from "./test-pdf";

describe("pdfPageCount", () => {
  it("counts the pages", async () => {
    const pdf = testPdf("census.pdf", [
      [72, 72],
      [144, 72],
    ]);

    expect(await pdfPageCount(pdf)).toBe(2);
  });
});

describe("pdfPageToPng", () => {
  it("renders the chosen page as a PNG at 200 dpi", async () => {
    const pdf = testPdf("census.pdf", [
      [72, 72],
      [144, 36],
    ]);

    const png = await pdfPageToPng(pdf, 2);

    expect(png.type).toBe("image/png");
    const image = await createImageBitmap(png);
    expect([image.width, image.height]).toEqual([400, 100]);
  });

  it("rejects a file that isn't a PDF", async () => {
    await expect(
      pdfPageToPng(new File(["not a pdf"], "x.pdf"), 1),
    ).rejects.toThrow();
  });
});
