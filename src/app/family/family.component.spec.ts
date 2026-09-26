import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { FamilyFactsComponent } from "./family-facts.component";
import { FamilyGedcomComponent } from "./family-gedcom.component";
import { FamilySourcesComponent } from "./family-sources.component";
import { FamilyComponent } from "./family.component";

describe("FamilyComponent", () => {
  let component: FamilyComponent;
  let fixture: ComponentFixture<FamilyComponent>;
  let element: HTMLElement;

  const ancestryDatabase = signal(
    newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          names: [newGedcomName({ givenName: "John", surname: "Doe" })],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          names: [newGedcomName({ givenName: "Jane", surname: "Smith" })],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I3@": newGedcomIndividual({
          xref: "@I3@",
          names: [newGedcomName({ givenName: "Baby", surname: "Doe" })],
          childOfFamilyXrefs: ["@F1@"],
        }),
      },
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
    }),
  );

  beforeEach(async () => {
    const renderResult = await render(FamilyComponent, {
      providers: [
        provideRouter(
          [
            { path: "", redirectTo: "facts", pathMatch: "full" },
            {
              path: "facts",
              component: FamilyFactsComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@F1@",
              },
            },
            {
              path: "sources",
              component: FamilySourcesComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@F1@",
              },
            },
            {
              path: "gedcom",
              component: FamilyGedcomComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@F1@",
              },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", signal("@F1@")),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    await TestBed.inject(Router).navigateByUrl("/");
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("matches screenshot", async () => {
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });
});
