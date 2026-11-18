import type { PDFDocumentLoadingTask } from "pdfjs-dist";

// Rendering resolution. PDFs measure pages in points (1/72 inch); 200 dpi
// keeps scanned records legible after cropping without huge files.
const RENDER_DPI = 200;

// pdf.js is large, so it's only loaded once someone picks a PDF. Its
// parser runs on the page rather than in a web worker: converting one page
// is a short, user-initiated wait, and it avoids bundling a separate worker
// script (which the unit-test runner can't serve). Destroy the returned task
// when done with the document.
async function openPdf(file: Blob): Promise<PDFDocumentLoadingTask> {
  const [pdfjs] = await Promise.all([
    import("pdfjs-dist"),
    // Registers itself as globalThis.pdfjsWorker, which pdf.js then uses
    // in place of a worker.
    // @ts-expect-error pdf.js ships no type declarations for this bundle.
    import("pdfjs-dist/build/pdf.worker.min.mjs"),
  ]);
  return pdfjs.getDocument({
    data: await file.arrayBuffer(),
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });
}

export async function pdfPageCount(file: Blob): Promise<number> {
  const task = await openPdf(file);
  try {
    return (await task.promise).numPages;
  } finally {
    await task.destroy();
  }
}

// Renders one page (numbered from 1) of a PDF as a PNG, so it can be
// cropped: GEDCOM's CROP is measured in pixels, which a PDF doesn't have.
export async function pdfPageToPng(
  file: Blob,
  pageNumber: number,
): Promise<Blob> {
  const task = await openPdf(file);
  try {
    const page = await (await task.promise).getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_DPI / 72 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Couldn't encode the page as a PNG."));
        }
      }, "image/png");
    });
  } finally {
    await task.destroy();
  }
}
