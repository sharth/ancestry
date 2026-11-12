import { ApplicationRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { AncestryService } from "../database/ancestry.service";
import { newGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { multimediaFileResource } from "./multimedia-file-resource";

describe("multimediaFileResource", () => {
  function setUp(fields: { filePath: string; pendingFile?: File }) {
    const folderFile = new File(["png"], "scan.png", { type: "image/png" });
    // A data folder holding only scan.png.
    const getFileHandle = vi.fn((name: string) =>
      name === "scan.png"
        ? Promise.resolve({ getFile: () => Promise.resolve(folderFile) })
        : Promise.reject(new DOMException("Not found", "NotFoundError")),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: {
              value: () => ({ directoryHandle: { getFileHandle } }),
            },
          },
        },
      ],
    });
    const multimedia = signal(newGedcomMultimedia({ xref: "@M1@", ...fields }));
    const fileResource = TestBed.runInInjectionContext(() =>
      multimediaFileResource(multimedia),
    );
    return { folderFile, getFileHandle, multimedia, fileResource };
  }

  it("loads the file at the record's path from the data folder", async () => {
    const { fileResource, getFileHandle } = setUp({
      filePath: "scan.png",
    });

    await vi.waitFor(() => {
      expect(fileResource.value()?.mediaType).toBe("image/png");
    });
    expect(getFileHandle).toHaveBeenCalledWith("scan.png");
  });

  it("uses a pending file without reading the data folder", async () => {
    const pendingFile = new File(["pdf"], "picked.pdf", {
      type: "application/pdf",
    });
    const { fileResource, getFileHandle } = setUp({
      filePath: "not-copied-yet.pdf",
      pendingFile,
    });

    await vi.waitFor(() => {
      expect(fileResource.value()?.mediaType).toBe("application/pdf");
    });
    expect(getFileHandle).not.toHaveBeenCalled();
  });

  it("gives undefined when there's no file at the path", async () => {
    const { fileResource, getFileHandle } = setUp({
      filePath: "missing.png",
    });

    await vi.waitFor(() => {
      expect(getFileHandle).toHaveBeenCalledWith("missing.png");
    });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(fileResource.value()).toBeUndefined();
  });

  it("doesn't reload the file when another field changes", async () => {
    const { fileResource, getFileHandle, multimedia } = setUp({
      filePath: "scan.png",
    });
    await vi.waitFor(() => {
      expect(fileResource.value()).toBeDefined();
    });

    multimedia.update((m) => ({ ...m, title: "Census" }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(getFileHandle).toHaveBeenCalledTimes(1);
    expect(fileResource.isLoading()).toBe(false);
  });
});
