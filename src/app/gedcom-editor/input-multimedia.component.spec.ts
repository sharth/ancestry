import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { InputMultimediaComponent } from "./input-multimedia.component";

describe("InputMultimediaComponent", () => {
  let fixture: ComponentFixture<InputMultimediaComponent>;
  let component: InputMultimediaComponent;

  beforeEach(async () => {
    const renderResult = await render(InputMultimediaComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("browseFile", () => {
    const file = new File(["png"], "IMG_0042.PNG", { type: "image/png" });
    const fileHandle = {
      getFile: () => Promise.resolve(file),
    } as unknown as FileSystemFileHandle;
    let resolvedPath: string[] | null;

    beforeEach(() => {
      resolvedPath = null;
      const directoryHandle = {
        resolve: () => Promise.resolve(resolvedPath),
      } as unknown as FileSystemDirectoryHandle;
      vi.spyOn(
        component.ancestryService.gedcomResource,
        "value",
      ).mockReturnValue({ directoryHandle } as ReturnType<
        typeof component.ancestryService.gedcomResource.value
      >);
      vi.spyOn(window, "showOpenFilePicker").mockResolvedValue([fileHandle]);
      component.value.set(
        newGedcomMultimedia({ xref: "O12", title: "1901 Census" }),
      );
    });

    it("links a file inside the data folder where it is", async () => {
      resolvedPath = ["scans", "census.png"];
      const copy = vi.spyOn(component.ancestryService, "copyMultimediaFile");

      await component.browseFile();

      expect(copy).not.toHaveBeenCalled();
      expect(component.value().filePath).toBe("scans/census.png");
      expect(component.value().mediaType).toBe("image/png");
    });

    it("copies a file from outside the data folder after confirming", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
      const copy = vi
        .spyOn(component.ancestryService, "copyMultimediaFile")
        .mockResolvedValue("O12 1901 Census (2).png");

      await component.browseFile();

      expect(confirm).toHaveBeenCalledWith(
        expect.stringContaining('"O12 1901 Census.png"'),
      );
      expect(copy).toHaveBeenCalledWith(file, "O12 1901 Census.png");
      expect(component.value().filePath).toBe("O12 1901 Census (2).png");
    });

    it("leaves the record alone if the copy is declined", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const copy = vi.spyOn(component.ancestryService, "copyMultimediaFile");

      await component.browseFile();

      expect(copy).not.toHaveBeenCalled();
      expect(component.value().filePath).toBe("");
    });
  });
});
