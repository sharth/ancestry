import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";
import { UnsavedChangesTracker } from "../unsaved-changes.guard";
import { GedcomEditorDialogComponent } from "./gedcom-editor-dialog.component";

describe("GedcomEditorDialogComponent", () => {
  let component: GedcomEditorDialogComponent;
  let fixture: ComponentFixture<GedcomEditorDialogComponent>;
  let ancestryService: AncestryService;

  beforeEach(async () => {
    const renderResult = await render(GedcomEditorDialogComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("type", signal<"INDI" | "SOUR" | "OBJE" | "REPO">("INDI")),
        inputBinding("ancestryDatabase", signal(newGedcomDatabase())),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    ancestryService = TestBed.inject(AncestryService);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("registers with UnsavedChangesTracker on creation and unregisters on destroy", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    const hasUnsavedChangesSpy = vi.spyOn(component, "hasUnsavedChanges");

    tracker.hasUnsavedChanges();
    expect(hasUnsavedChangesSpy).toHaveBeenCalled();

    hasUnsavedChangesSpy.mockClear();
    fixture.destroy();
    tracker.hasUnsavedChanges();
    expect(hasUnsavedChangesSpy).not.toHaveBeenCalled();
  });

  it("requests write permission before showing the dialog", async () => {
    const requestWritePermissionSpy = vi
      .spyOn(ancestryService, "requestWritePermission")
      .mockResolvedValue(true);

    await component.showModal();

    expect(requestWritePermissionSpy).toHaveBeenCalled();
    expect(component.editDialog().nativeElement.open).toBe(true);
  });

  // These tests stub out the nested <app-gedcom-editor> rather than
  // actually opening the dialog: the real child renders a Signal Forms
  // form over an immer-produced (and therefore deep-frozen) working
  // database, which this test environment's dev-mode immer checks reject
  // when the form tries to attach its own tracking metadata to the frozen
  // objects. That's a pre-existing fragility unrelated to this guard.
  function stubGedcomEditor(hasUnsavedChanges: boolean) {
    vi.spyOn(component, "gedcomEditor").mockReturnValue({
      hasUnsavedChanges: () => hasUnsavedChanges,
    } as unknown as GedcomEditorComponent);
  }

  function setDialogOpen(open: boolean) {
    component.editDialog().nativeElement.open = open;
  }

  describe("hasUnsavedChanges tests", () => {
    it("returns false when the dialog is closed, even with unsaved changes", () => {
      stubGedcomEditor(true);
      setDialogOpen(false);

      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it("returns false when the dialog is open but nothing has been edited", () => {
      stubGedcomEditor(false);
      setDialogOpen(true);

      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it("returns true once the dialog is open and something has been edited", () => {
      stubGedcomEditor(true);
      setDialogOpen(true);

      expect(component.hasUnsavedChanges()).toBe(true);
    });
  });

  describe("onBeforeUnload tests", () => {
    it("prevents the default action when there are unsaved changes", () => {
      stubGedcomEditor(true);
      setDialogOpen(true);

      const event = new Event("beforeunload");
      const preventDefault = vi.spyOn(event, "preventDefault");
      component.onBeforeUnload(event);
      expect(preventDefault).toHaveBeenCalled();
    });

    it("does not prevent the default action when there are no unsaved changes", () => {
      const event = new Event("beforeunload");
      const preventDefault = vi.spyOn(event, "preventDefault");
      component.onBeforeUnload(event);
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("onDialogCancel tests", () => {
    it("prevents the dialog from closing when the user declines to discard changes", () => {
      stubGedcomEditor(true);
      setDialogOpen(true);

      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      const event = new Event("cancel", { cancelable: true });
      const preventDefault = vi.spyOn(event, "preventDefault");
      component.onDialogCancel(event);
      expect(confirmSpy).toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    });

    it("allows the dialog to close when there are no unsaved changes", () => {
      const confirmSpy = vi.spyOn(window, "confirm");
      const event = new Event("cancel", { cancelable: true });
      const preventDefault = vi.spyOn(event, "preventDefault");
      component.onDialogCancel(event);
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
