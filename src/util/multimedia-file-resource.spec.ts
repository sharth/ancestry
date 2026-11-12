import { ApplicationRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { AncestryService } from "../database/ancestry.service";
import { newGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { multimediaFileResource } from "./multimedia-file-resource";

describe("multimediaFileResource", () => {
  function setUp(fields: { filePath: string; pendingFile?: File }) {
    const folderFile = new File(["png"], "scan.png", { type: "image/png" });
    const getMultimediaFileHandle = vi.fn((filePath: string) =>
      Promise.resolve(
        filePath === "scan.png"
          ? { getFile: () => Promise.resolve(folderFile) }
          : undefined,
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: { value: () => undefined },
            getMultimediaFileHandle,
          },
        },
      ],
    });
    const multimedia = signal(newGedcomMultimedia({ xref: "@M1@", ...fields }));
    const fileResource = TestBed.runInInjectionContext(() =>
      multimediaFileResource(multimedia),
    );
    return { folderFile, getMultimediaFileHandle, multimedia, fileResource };
  }

  it("loads the file at the record's path from the data folder", async () => {
    const { fileResource, getMultimediaFileHandle } = setUp({
      filePath: "scan.png",
    });

    await vi.waitFor(() => {
      expect(fileResource.value()?.mediaType).toBe("image/png");
    });
    expect(getMultimediaFileHandle).toHaveBeenCalledWith("scan.png");
  });

  it("uses a pending file without reading the data folder", async () => {
    const pendingFile = new File(["pdf"], "picked.pdf", {
      type: "application/pdf",
    });
    const { fileResource, getMultimediaFileHandle } = setUp({
      filePath: "not-copied-yet.pdf",
      pendingFile,
    });

    await vi.waitFor(() => {
      expect(fileResource.value()?.mediaType).toBe("application/pdf");
    });
    expect(getMultimediaFileHandle).not.toHaveBeenCalled();
  });

  it("gives undefined when there's no file at the path", async () => {
    const { fileResource, getMultimediaFileHandle } = setUp({
      filePath: "missing.png",
    });

    await vi.waitFor(() => {
      expect(getMultimediaFileHandle).toHaveBeenCalledWith("missing.png");
    });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(fileResource.value()).toBeUndefined();
  });

  it("doesn't reload the file when another field changes", async () => {
    const { fileResource, getMultimediaFileHandle, multimedia } = setUp({
      filePath: "scan.png",
    });
    await vi.waitFor(() => {
      expect(fileResource.value()).toBeDefined();
    });

    multimedia.update((m) => ({ ...m, title: "Census" }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(getMultimediaFileHandle).toHaveBeenCalledTimes(1);
    expect(fileResource.isLoading()).toBe(false);
  });
});
