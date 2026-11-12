import { inputBinding, signal, type WritableSignal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import {
  type GedcomDatabase,
  newGedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { MultimediasComponent } from "./multimedias.component";

describe("MultimediasComponent", () => {
  let component: MultimediasComponent;
  let fixture: ComponentFixture<MultimediasComponent>;
  let ancestryDatabase: WritableSignal<GedcomDatabase>;

  beforeEach(async () => {
    ancestryDatabase = signal(newGedcomDatabase());
    const renderResult = await render(MultimediasComponent, {
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      providers: [provideRouter([])],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("lists multimedia alphabetically by displayed label", async () => {
    const gedcomDatabase = newGedcomDatabase();
    for (const multimedia of [
      newGedcomMultimedia({ xref: "@M1@", title: "Zebra" }),
      newGedcomMultimedia({ xref: "@M2@", filePath: "media/mango.jpg" }),
      newGedcomMultimedia({ xref: "@M3@", title: "apple" }),
      newGedcomMultimedia({ xref: "@M4@", title: "Banana" }),
    ]) {
      gedcomDatabase.multimedias[multimedia.xref] = multimedia;
    }
    ancestryDatabase.set(gedcomDatabase);
    await fixture.whenStable();

    const links = screen
      .getAllByRole("link")
      .map((link) => link.textContent.trim());
    expect(links).toEqual(["apple", "Banana", "media/mango.jpg", "Zebra"]);
  });
});
