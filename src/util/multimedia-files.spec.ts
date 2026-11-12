import { ApplicationRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, vi } from "vitest";

import { AncestryService } from "../database/ancestry.service";
import { multimediaFiles } from "./multimedia-files";

describe("multimediaFiles", () => {
  function setUp() {
    const file = new File(["png"], "scan.png", { type: "image/png" });
    const gedcomResourceValue = signal({});
    const getMultimediaFile = vi.fn((filePath: string) =>
      Promise.resolve(filePath === "scan.png" ? file : undefined),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: { value: gedcomResourceValue },
            getMultimediaFile,
          },
        },
      ],
    });
    const files = TestBed.runInInjectionContext(() => multimediaFiles());
    return { file, files, getMultimediaFile, gedcomResourceValue };
  }

  it("gives the file at a path once it has loaded", async () => {
    const { file, files } = setUp();

    expect(files("scan.png")).toBeUndefined();
    await vi.waitFor(() => {
      expect(files("scan.png")).toBe(file);
    });
  });

  it("gives undefined for a path with no file", async () => {
    const { files, getMultimediaFile } = setUp();

    files("missing.png");
    await vi.waitFor(() => {
      expect(getMultimediaFile).toHaveBeenCalledWith("missing.png");
    });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(files("missing.png")).toBeUndefined();
  });

  it("reads each path once, however often it's asked for", async () => {
    const { file, files, getMultimediaFile } = setUp();

    await vi.waitFor(() => {
      expect(files("scan.png")).toBe(file);
    });
    files("scan.png");
    files("scan.png");
    expect(getMultimediaFile).toHaveBeenCalledTimes(1);
  });

  it("rereads when different data is loaded", async () => {
    const { file, files, getMultimediaFile, gedcomResourceValue } = setUp();

    await vi.waitFor(() => {
      expect(files("scan.png")).toBe(file);
    });
    gedcomResourceValue.set({});
    await vi.waitFor(() => {
      expect(getMultimediaFile).toHaveBeenCalledTimes(2);
    });
  });
});
