import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { AncestryService } from "../database/ancestry.service";
import { multimediaBlobsResource } from "./multimedia-blobs";

describe("multimediaBlobsResource", () => {
  function setUp(initialPaths: string[]) {
    const scan = new File(["png"], "scan.png", { type: "image/png" });
    const paths = signal(initialPaths);
    const getMultimediaFile = vi.fn((filePath: string) =>
      Promise.resolve(filePath === "scan.png" ? scan : undefined),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: { value: signal({}) },
            getMultimediaFile,
          },
        },
      ],
    });
    const blobs = TestBed.runInInjectionContext(() =>
      multimediaBlobsResource(paths),
    );
    return { scan, paths, blobs, getMultimediaFile };
  }

  it("loads each path's file, leaving out paths with none", async () => {
    const { scan, blobs } = setUp(["scan.png", "missing.png"]);

    await vi.waitFor(() => {
      expect(blobs.value()).toEqual(new Map([["scan.png", scan]]));
    });
  });

  it("doesn't reload for a new list of the same paths", async () => {
    const { scan, paths, blobs, getMultimediaFile } = setUp(["scan.png"]);
    await vi.waitFor(() => {
      expect(blobs.value()?.get("scan.png")).toBe(scan);
    });

    paths.set(["scan.png", "scan.png"]);
    TestBed.tick();

    expect(blobs.isLoading()).toBe(false);
    expect(getMultimediaFile).toHaveBeenCalledTimes(1);
  });
});
