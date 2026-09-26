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
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";
import { IndividualFactsComponent } from "./individual-facts.component";
import { IndividualGedcomComponent } from "./individual-gedcom.component";
import { IndividualSourcesComponent } from "./individual-sources.component";
import { IndividualComponent } from "./individual.component";

describe("IndividualComponent", () => {
  let component: IndividualComponent;
  let fixture: ComponentFixture<IndividualComponent>;
  let element: HTMLElement;

  const ancestryDatabase = signal(
    newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          names: [newGedcomName({ givenName: "John", surname: "Doe" })],
          sex: newGedcomSex({ sex: "M" }),
          facts: [
            newGedcomFact({
              tag: "BIRT",
              date: { value: "1 JAN 1900" },
              place: "Springfield",
              citations: [
                newGedcomSourceCitation({
                  sourceXref: "@S1@",
                  page: "Page 42",
                  text: "Birth record excerpt",
                }),
              ],
            }),
          ],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          names: [newGedcomName({ givenName: "Jane", surname: "Smith" })],
          sex: newGedcomSex({ sex: "F" }),
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
      },
    }),
  );

  beforeEach(async () => {
    const renderResult = await render(IndividualComponent, {
      providers: [
        provideRouter(
          [
            { path: "", redirectTo: "facts", pathMatch: "full" },
            {
              path: "facts",
              component: IndividualFactsComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@I1@",
              },
            },
            {
              path: "ancestors",
              component: IndividualAncestorsComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@I1@",
              },
            },
            {
              path: "sources",
              component: IndividualSourcesComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@I1@",
              },
            },
            {
              path: "gedcom",
              component: IndividualGedcomComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@I1@",
              },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", signal("@I1@")),
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
