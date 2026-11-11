import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MultimediaFileExistsError } from "../../database/ancestry.service";
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
        newGedcomMultimedia({ xref: "@O12@", title: "1901 Census" }),
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

    it("offers to copy a file from outside the data folder", async () => {
      const copy = vi.spyOn(component.ancestryService, "copyMultimediaFile");

      await component.browseFile();
      await fixture.whenStable();

      expect(copy).not.toHaveBeenCalled();
      expect(component.value().filePath).toBe("");
      expect(screen.getByLabelText("Copy as")).toHaveProperty(
        "placeholder",
        "O12 1901 Census.png",
      );
    });

    it("proposes a name that follows the title", async () => {
      await component.browseFile();
      component.value.update((m) => ({ ...m, title: "1911 Census" }));

      expect(component.proposedFileName()).toBe("O12 1911 Census.png");
    });

    it("copies under the proposed name when none is typed", async () => {
      const copy = vi
        .spyOn(component.ancestryService, "copyMultimediaFile")
        .mockResolvedValue();

      await component.browseFile();
      await component.copyFile();

      expect(copy).toHaveBeenCalledWith(file, "O12 1901 Census.png");
      expect(component.value().filePath).toBe("O12 1901 Census.png");
      expect(component.value().mediaType).toBe("image/png");
      expect(component.pendingFile()).toBeUndefined();
    });

    it("copies under a typed name, sanitized", async () => {
      const copy = vi
        .spyOn(component.ancestryService, "copyMultimediaFile")
        .mockResolvedValue();

      await component.browseFile();
      component.copyFileName.set(" Census: Smith.png ");
      await component.copyFile();

      expect(copy).toHaveBeenCalledWith(file, "Census Smith.png");
      expect(component.value().filePath).toBe("Census Smith.png");
    });

    it("reports an error if the file already exists", async () => {
      vi.spyOn(
        component.ancestryService,
        "copyMultimediaFile",
      ).mockRejectedValue(new MultimediaFileExistsError("O12 1901 Census.png"));

      await component.browseFile();
      await component.copyFile();
      await fixture.whenStable();

      expect(component.value().filePath).toBe("");
      expect(component.pendingFile()).toBe(file);
      expect(
        screen.getByText(/"O12 1901 Census.png" already exists/),
      ).toBeTruthy();
    });

    it("leaves the record alone if the copy is cancelled", async () => {
      const copy = vi.spyOn(component.ancestryService, "copyMultimediaFile");

      await component.browseFile();
      component.cancelCopy();
      await fixture.whenStable();

      expect(copy).not.toHaveBeenCalled();
      expect(component.value().filePath).toBe("");
      expect(screen.queryByLabelText("Copy as")).toBeNull();
    });
  });
});
