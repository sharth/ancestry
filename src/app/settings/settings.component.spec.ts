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

  // DIAGNOSTIC (temporary): OPFS setup and the two OPFS/resource-loading
  // tests are disabled below to check whether they -- vs. just rendering
  // SettingsComponent at all -- are what corrupts a later test file's
  // browser connection.
  // beforeEach(async () => {
  //   await ancestryService.clearDatabase();
  //   await fixture.whenStable();
  //
  //   const rootDirectory = await navigator.storage.getDirectory();
  //   gedcomFileHandle = await rootDirectory.getFileHandle("ancestry.ged", {
  //     create: true,
  //   });
  // });
  //
  // // Polyfill window.showOpenFilePicker
  // aroundEach(async (runTest) => {
  //   const original = window.showOpenFilePicker;
  //   // eslint-disable-next-line @typescript-eslint/require-await
  //   window.showOpenFilePicker = async () => [gedcomFileHandle];
  //   await runTest();
  //   window.showOpenFilePicker = original;
  // });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // it("should load the builtin example data when Use Example Data is clicked", async () => {
  //   const componentElement = fixture.nativeElement as HTMLElement;
  //   const button = Array.from(
  //     componentElement.querySelectorAll<HTMLButtonElement>("button"),
  //   ).find((b) => b.textContent.includes("Use Example Data"));
  //   assert.isOk(button);
  //   button.click();
  //
  //   await vi.waitFor(async () => {
  //     await fixture.whenStable();
  //     expect(ancestryService.gedcomResource.value()?.dataSource?.mode).toBe(
  //       "builtin",
  //     );
  //   });
  //   expect(
  //     ancestryService.gedcomResource.value()?.gedcomRecords.length,
  //   ).toBeGreaterThan(0);
  // });
  //
  // it("should call openGedcom when the GEDCOM file button is clicked", async () => {
  //   const componentElement = fixture.nativeElement as HTMLElement;
  //   const button = Array.from(
  //     componentElement.querySelectorAll<HTMLButtonElement>("button"),
  //   ).find((b) => b.textContent.includes("Choose GEDCOM File"));
  //   assert.isOk(button);
  //   button.click();
  //
  //   await vi.waitFor(async () => {
  //     await fixture.whenStable();
  //     expect(ancestryService.gedcomResource.value()?.dataSource?.mode).toBe(
  //       "gedcom",
  //     );
  //   });
  // });
});
