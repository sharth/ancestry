import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import {
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
      expect(ancestryService.gedcomResource.value()?.dataSource?.mode).toBe(
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
});
