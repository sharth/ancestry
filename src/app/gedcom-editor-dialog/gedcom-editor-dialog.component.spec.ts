import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "./gedcom-editor-dialog.component";

describe("GedcomEditorDialogComponent", () => {
  let component: GedcomEditorDialogComponent;
  let fixture: ComponentFixture<GedcomEditorDialogComponent>;
  let ancestryService: AncestryService;

  beforeEach(async () => {
    const renderResult = await render(GedcomEditorDialogComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("tabs", signal([{ type: "INDI" as const, xref: "" }])),
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

  it("requests write permission before showing the dialog", async () => {
    const requestWritePermissionSpy = vi
      .spyOn(ancestryService, "requestWritePermission")
      .mockResolvedValue(true);

    await component.showModal();

    expect(requestWritePermissionSpy).toHaveBeenCalled();
    expect(component.editDialog().nativeElement.open).toBe(true);
  });
});
