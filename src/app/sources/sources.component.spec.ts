import {
  inputBinding,
  signal,
  type WritableSignal,
  computed,
} from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import {
  type GedcomDatabase,
  newGedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { SourcesComponent } from "./sources.component";

describe("SourcesComponent", () => {
  let component: SourcesComponent;
  let fixture: ComponentFixture<SourcesComponent>;
  let ancestryDatabase: WritableSignal<GedcomDatabase>;

  beforeEach(async () => {
    ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(SourcesComponent, {
      bindings: [
        inputBinding(
          "gedcom",
          computed(() =>
            newGedcomResourceValue({ gedcomDatabase: ancestryDatabase() }),
          ),
        ),
      ],
      providers: [provideRouter([])],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("lists sources alphabetically by displayed label", async () => {
    const gedcomDatabase = newGedcomDatabase();
    for (const source of [
      newGedcomSource({ xref: "@S1@", abbr: "Zebra Census" }),
      newGedcomSource({ xref: "@S9@" }),
      newGedcomSource({ xref: "@S2@" }),
      newGedcomSource({ xref: "@S3@", abbr: "baptisms" }),
      newGedcomSource({ xref: "@S4@", abbr: "Burials" }),
    ]) {
      gedcomDatabase.sources[source.xref] = source;
    }
    ancestryDatabase.set(gedcomDatabase);
    await fixture.whenStable();

    const links = screen
      .getAllByRole("link")
      .map((link) => link.textContent.trim());
    expect(links).toEqual([
      "@S2@",
      "@S9@",
      "baptisms",
      "Burials",
      "Zebra Census",
    ]);
  });
});
