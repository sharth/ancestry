import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import {
  GEDCOM_EDITOR,
  type GedcomEditorInterface,
} from "./gedcom-editor-interface";
import { InputMultimediaComponent } from "./input-multimedia.component";

describe("InputMultimediaComponent", () => {
  let fixture: ComponentFixture<InputMultimediaComponent>;
  let component: InputMultimediaComponent;

  beforeEach(async () => {
    // Browse... needs an editor to copy the picked file in on submit.
    const gedcomEditor: Partial<GedcomEditorInterface> = {};
    const renderResult = await render(InputMultimediaComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      providers: [{ provide: GEDCOM_EDITOR, useValue: gedcomEditor }],
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

  it("only lets the source file be chosen with Browse...", () => {
    expect(
      screen.getByLabelText<HTMLInputElement>("Source File").readOnly,
    ).toBe(true);
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

      await component.browseFile();

      expect(component.value().pendingFile).toBeUndefined();
      expect(component.sourceFileName()).toBe("scans/census.png");
      expect(component.value().filePath).toBe("scans/census.png");
      expect(component.value().mediaType).toBe("image/png");
    });

    it("queues a file from outside the data folder under the proposed name", async () => {
      const exists = vi
        .spyOn(component.ancestryService, "multimediaFileExists")
        .mockResolvedValue(false);

      await component.browseFile();
      await fixture.whenStable();

      expect(component.value().pendingFile).toBe(file);
      expect(screen.getByLabelText<HTMLInputElement>("Source File").value).toBe(
        "IMG_0042.PNG",
      );
      expect(component.value().filePath).toBe("O12 1901 Census.png");
      expect(component.value().mediaType).toBe("image/png");
      expect(exists).toHaveBeenCalledWith("O12 1901 Census.png");
      expect(screen.getByText(/will be copied in at this path/)).toBeTruthy();
    });

    function typeInto(label: string, text: string) {
      const input = screen.getByLabelText<HTMLInputElement>(label);
      input.value = text;
      input.dispatchEvent(new Event("input"));
    }

    it("keeps the default name following the title", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(false);

      await component.browseFile();
      await fixture.whenStable();
      typeInto("Title", "1911 Census");
      await fixture.whenStable();

      expect(component.value().filePath).toBe("O12 1911 Census.png");
    });

    it("shows the default name as a tinted value", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(false);

      await component.browseFile();
      await fixture.whenStable();
      const input = screen.getByLabelText<HTMLInputElement>("File Path");

      expect(input.value).toBe("O12 1901 Census.png");
      expect(input.classList).toContain("default-file-name");
      expect(
        screen.getByRole<HTMLInputElement>("radio", {
          name: "Default filename",
        }).checked,
      ).toBe(true);
    });

    it("switches to a custom name when the path is typed, and back with the button", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(false);

      await component.browseFile();
      await fixture.whenStable();
      typeInto("File Path", "Census Smith.png");
      typeInto("Title", "1911 Census");
      await fixture.whenStable();

      expect(component.value().filePath).toBe("Census Smith.png");
      expect(
        screen.getByLabelText<HTMLInputElement>("File Path").classList,
      ).not.toContain("default-file-name");

      expect(
        screen.getByRole<HTMLInputElement>("radio", { name: "Custom filename" })
          .checked,
      ).toBe(true);

      screen.getByRole("radio", { name: "Default filename" }).click();
      await fixture.whenStable();

      expect(component.value().filePath).toBe("O12 1911 Census.png");
      expect(component.form.filePath().dirty()).toBe(false);
      expect(
        screen.getByRole<HTMLInputElement>("radio", {
          name: "Default filename",
        }).checked,
      ).toBe(true);
    });

    it("keeps the current name when Custom filename is chosen", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(false);

      await component.browseFile();
      await fixture.whenStable();
      screen.getByRole("radio", { name: "Custom filename" }).click();
      typeInto("Title", "1911 Census");
      await fixture.whenStable();

      expect(component.value().filePath).toBe("O12 1901 Census.png");
    });

    it("reports an error if the file already exists", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(true);

      await component.browseFile();
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(
          screen.getByText(/"O12 1901 Census.png" already exists/),
        ).toBeTruthy();
      });
    });

    it("checks the path again when the window regains focus", async () => {
      const exists = vi
        .spyOn(component.ancestryService, "multimediaFileExists")
        .mockResolvedValue(false);

      await component.browseFile();
      await vi.waitFor(() => {
        expect(exists).toHaveBeenCalledTimes(1);
      });
      exists.mockResolvedValue(true);
      window.dispatchEvent(new Event("focus"));

      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(
          screen.getByText(/"O12 1901 Census.png" already exists/),
        ).toBeTruthy();
      });
    });

    it("drops a queued file when a file inside the folder is picked", async () => {
      vi.spyOn(
        component.ancestryService,
        "multimediaFileExists",
      ).mockResolvedValue(false);

      await component.browseFile();
      resolvedPath = ["census.png"];
      await component.browseFile();

      expect(component.value().pendingFile).toBeUndefined();
      expect(component.value().filePath).toBe("census.png");
    });
  });
});
