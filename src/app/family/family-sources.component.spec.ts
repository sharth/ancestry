import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { FamilySourcesComponent } from "./family-sources.component";

describe("FamilySourcesComponent", () => {
  let component: FamilySourcesComponent;
  let fixture: ComponentFixture<FamilySourcesComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const ancestryDatabase = newGedcomDatabase({
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
              citations: [
                newGedcomSourceCitation({
                  sourceXref: "@S1@",
                  page: "Marriage license page 3",
                  text: "Marriage record excerpt",
                }),
              ],
            }),
          ],
          citations: [
            newGedcomSourceCitation({
              sourceXref: "@S2@",
              page: "Family group sheet",
            }),
          ],
        }),
      },
      sources: {
        "@S1@": newGedcomSource({
          xref: "@S1@",
          abbr: "Vital Records",
          title: "Springfield Vital Records Office",
        }),
        "@S2@": newGedcomSource({
          xref: "@S2@",
          abbr: "FGS",
          title: "Family Group Sheet Collection",
        }),
      },
    });

    const renderResult = await render(FamilySourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(ancestryDatabase)),
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
