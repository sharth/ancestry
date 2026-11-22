import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { render, within } from "@testing-library/angular/zoneless";
import {
  afterEach,
  aroundEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { SettingsComponent } from "./settings.component";

describe("SettingsComponent", () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let ancestryService: AncestryService;

  let gedcomFileHandle: FileSystemFileHandle;

  // A small stand-in for the built-in example file. Every change to the
  // data source or root person re-reads and re-parses the file, and the real
  // royal-family.ged takes about half a second to parse here, more on CI,
  // which ran past vi.waitFor's one-second default.
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            [
              "0 HEAD",
              "1 GEDC",
              "2 VERS 7.0.18",
              "0 @I1@ INDI",
              "1 NAME Elizabeth /Windsor/",
              "2 GIVN Elizabeth",
              "2 SURN Windsor",
              "0 @I2@ INDI",
              "1 NAME Philip /Mountbatten/",
              "2 GIVN Philip",
              "2 SURN Mountbatten",
              "0 TRLR",
              "",
            ].join("\n"),
          ),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    const renderResult = await render(SettingsComponent, {
      waitForStableOnRender: true,
    });

    ancestryService = TestBed.inject(AncestryService);
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  beforeEach(async () => {
    await ancestryService.clearDatabase();
    await fixture.whenStable();

    // A lightweight stand-in rather than a real Origin Private File System
    // handle: real OPFS access here destabilized the CI browser session
    // (see #407), and since the test below stubs AncestryService.openGedcom
    // itself, this handle only needs to be an object the component can pass
    // through unchanged -- it's never read or persisted to Dexie.
    gedcomFileHandle = {
      name: "ancestry.ged",
    } as unknown as FileSystemFileHandle;
  });

  // Polyfill window.showOpenFilePicker
  aroundEach(async (runTest) => {
    const original = window.showOpenFilePicker;
    // eslint-disable-next-line @typescript-eslint/require-await
    window.showOpenFilePicker = async () => [gedcomFileHandle];
    await runTest();
    window.showOpenFilePicker = original;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the builtin example data when Use Example Data is clicked", async () => {
    const componentElement = fixture.nativeElement as HTMLElement;
    const button = Array.from(
      componentElement.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent.includes("Use Example Data"));
    assert.isOk(button);
    button.click();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(ancestryService.gedcomResource.value()?.dataSource.mode).toBe(
        "builtin",
      );
    });
    expect(
      ancestryService.gedcomResource.value()?.gedcomRecords.length,
    ).toBeGreaterThan(0);
  });

  it("should call openGedcom when the GEDCOM file button is clicked", async () => {
    const openGedcomSpy = vi
      .spyOn(ancestryService, "openGedcom")
      .mockResolvedValue(undefined);

    const componentElement = fixture.nativeElement as HTMLElement;
    const button = Array.from(
      componentElement.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent.includes("Choose GEDCOM File"));
    assert.isOk(button);
    button.click();

    await vi.waitFor(() => {
      expect(openGedcomSpy).toHaveBeenCalledWith(gedcomFileHandle);
    });
  });

  it("saves the root person chosen from the loaded file", async () => {
    await ancestryService.openBuiltin();
    const componentElement = fixture.nativeElement as HTMLElement;
    const select = await vi.waitFor(async () => {
      await fixture.whenStable();
      const select =
        within(componentElement).getByLabelText<HTMLSelectElement>(
          "Root person",
        );
      assert.isOk(select);
      return select;
    });
    const option = Array.from(select.options).find((o) =>
      o.textContent.includes("Elizabeth"),
    );
    assert.isOk(option);

    select.value = option.value;
    select.dispatchEvent(new Event("change"));

    await vi.waitFor(() => {
      expect(ancestryService.gedcomResource.value()?.rootIndividualXref).toBe(
        option.value,
      );
    });
  });

  it("forgets the root person when a different data source is chosen", async () => {
    await ancestryService.openBuiltin();
    await ancestryService.setRootIndividualXref("@I1@");
    await vi.waitFor(() => {
      expect(ancestryService.gedcomResource.value()?.rootIndividualXref).toBe(
        "@I1@",
      );
    });

    await ancestryService.openBuiltin();

    await vi.waitFor(() => {
      expect(
        ancestryService.gedcomResource.value()?.rootIndividualXref,
      ).toBeUndefined();
    });
  });
});
