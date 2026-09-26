import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { FamilyGedcomComponent } from "./family-gedcom.component";

describe("FamilyGedcomComponent", () => {
  let component: FamilyGedcomComponent;
  let fixture: ComponentFixture<FamilyGedcomComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const renderResult = await render(FamilyGedcomComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              families: {
                "@F1@": newGedcomFamily({
                  xref: "@F1@",
                  husbandXref: "@I1@",
                  wifeXref: "@I2@",
                  childXrefs: ["@I3@"],
                  facts: [
                    newGedcomFact({
                      tag: "MARR",
                      date: { value: "20 JUN 1924" },
                      place: "Springfield",
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
});
