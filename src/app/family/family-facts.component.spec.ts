import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { FamilyFactsComponent } from "./family-facts.component";

describe("FamilyFactsComponent", () => {
  let component: FamilyFactsComponent;
  let fixture: ComponentFixture<FamilyFactsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const renderResult = await render(FamilyFactsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              individuals: {
                "@I1@": newGedcomIndividual({
                  xref: "@I1@",
                  names: [
                    newGedcomName({ givenName: "John", surname: "Doe" }),
                  ],
                }),
                "@I2@": newGedcomIndividual({
                  xref: "@I2@",
                  names: [
                    newGedcomName({ givenName: "Jane", surname: "Smith" }),
                  ],
                }),
              },
              families: {
                "@F1@": newGedcomFamily({
                  xref: "@F1@",
                  husbandXref: "@I1@",
                  wifeXref: "@I2@",
                  facts: [
                    newGedcomFact({
                      tag: "MARR",
                      date: { value: "20 JUN 1924" },
                      place: "Springfield",
                    }),
                    newGedcomFact({
                      tag: "DIV",
                      date: { value: "3 MAR 1940" },
                    }),
                  ],
                }),
              },
            }),
          ),
        ),
        inputBinding("xref", signal("@F1@")),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("matches screenshot", async () => {
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });

  it("should render events and relatives sections", () => {
    const headings = Array.from(element.querySelectorAll("h2")).map(
      (h) => h.textContent,
    );
    expect(headings).toEqual(["Events", "Relatives"]);
  });
});
