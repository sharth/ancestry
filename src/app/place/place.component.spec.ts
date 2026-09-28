import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { placeSlug } from "../places/places.util";
import { PlaceComponent } from "./place.component";

describe("PlaceComponent", () => {
  let component: PlaceComponent;
  let fixture: ComponentFixture<PlaceComponent>;

  const database = newGedcomDatabase({
    individuals: {
      I1: newGedcomIndividual({
        xref: "I1",
        facts: [newGedcomFact({ tag: "BIRT", place: "Boston, MA" })],
      }),
    },
  });

  async function renderPlace(slug: string) {
    const renderResult = await render(PlaceComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(database)),
        inputBinding("slug", signal(slug)),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  }

  it("renders the matching place's events", async () => {
    await renderPlace(placeSlug("Boston, MA"));

    expect(component.place()?.name).toBe("Boston, MA");
    expect(screen.getByText("Boston, MA")).toBeTruthy();
  });

  it("shows a not-found message for an unknown slug", async () => {
    await renderPlace("place-nowhere");

    expect(component.place()).toBeUndefined();
    expect(screen.getByText(/not found/i)).toBeTruthy();
  });
});
