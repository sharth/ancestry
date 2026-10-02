import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { PlaceComponent } from "./place.component";

describe("PlaceComponent", () => {
  let component: PlaceComponent;
  let fixture: ComponentFixture<PlaceComponent>;

  const database = newGedcomDatabase({
    individuals: {
      I1: newGedcomIndividual({
        xref: "I1",
        facts: [
          newGedcomFact({
            tag: "BIRT",
            place: "Elkton, Cecil County, Maryland, United States",
          }),
        ],
      }),
      I2: newGedcomIndividual({
        xref: "I2",
        facts: [
          newGedcomFact({
            tag: "BIRT",
            place: "Cecil County, Maryland, United States",
          }),
        ],
      }),
    },
  });

  async function renderPlace(path: string[]) {
    const renderResult = await render(PlaceComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(database)),
        inputBinding("path", signal(path)),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  }

  it("shows the regions directly under a broad path, plus every nested place's events", async () => {
    await renderPlace(["united-states", "maryland"]);

    expect(component.node()?.name).toBe("Maryland");
    expect(component.children().map((c) => c.name)).toEqual(["Cecil County"]);
    expect(screen.getByText("Cecil County")).toBeTruthy();

    // Maryland itself has no events recorded directly, but its descendants
    // (Cecil County and Elkton within it) do, and both should show up here.
    expect(component.placeGroups().map((p) => p.name)).toEqual([
      "Cecil County, Maryland, United States",
      "Elkton, Cecil County, Maryland, United States",
    ]);
    expect(screen.getByText(/Elkton, Cecil County/)).toBeTruthy();
  });

  it("shows both a place's own events and its sub-regions' events", async () => {
    await renderPlace(["united-states", "maryland", "cecil-county"]);

    expect(component.node()?.place?.name).toBe(
      "Cecil County, Maryland, United States",
    );
    expect(component.children().map((c) => c.name)).toEqual(["Elkton"]);
    expect(component.placeGroups().map((p) => p.name)).toEqual([
      "Cecil County, Maryland, United States",
      "Elkton, Cecil County, Maryland, United States",
    ]);
  });

  it("renders a leaf place's events with no sub-regions", async () => {
    await renderPlace(["united-states", "maryland", "cecil-county", "elkton"]);

    expect(component.children()).toEqual([]);
    expect(component.node()?.place?.name).toBe(
      "Elkton, Cecil County, Maryland, United States",
    );
  });

  it("shows a not-found message for an unknown path", async () => {
    await renderPlace(["nowhere"]);

    expect(component.node()).toBeUndefined();
    expect(screen.getByText(/not found/i)).toBeTruthy();
  });
});
