import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { aroundEach, assert, beforeEach, describe, expect, it } from "vitest";
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
    const rootDirectory = await navigator.storage.getDirectory();
    gedcomFileHandle = await rootDirectory.getFileHandle("ancestry.ged", {
      create: true,
    });
    await rootDirectory.getDirectoryHandle("multimedia", { create: true });
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

  it("should call openGedcom when button is clicked", () => {
    // Determine if button exists. Since resources are undefined by default mock, it shows "Load GEDCOM File" button.
    const componentElement = fixture.nativeElement as HTMLElement;
    const button =
      componentElement.querySelector<HTMLButtonElement>("button.btn-primary");
    assert.isOk(button);
    expect(button.textContent).toContain("Load GEDCOM File");
    button.click();

    console.log(ancestryService.gedcomResource.status());
    expect(ancestryService.gedcomResource.hasValue()).toBeTruthy();
  });
});
