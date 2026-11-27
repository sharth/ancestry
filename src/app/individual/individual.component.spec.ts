import { computed, inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomExternalIdentifier } from "../../gedcom/gedcomExternalIdentifier";
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

  const rootIndividualXref = signal<string | undefined>(undefined);
  const ancestryDatabase = signal(
    newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          names: [newGedcomName({ givenName: "John", surname: "Doe" })],
          sex: newGedcomSex({ sex: "M" }),
          externalIdentifiers: [
            newGedcomExternalIdentifier({
              id: "KWCB-QS1",
              type: "https://gedcom.io/exid-type/FamilySearch-PersonId",
            }),
          ],
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
                gedcom: () =>
                  newGedcomResourceValue({
                    gedcomDatabase: ancestryDatabase(),
                  }),
                xref: () => "@I1@",
              },
            },
            {
              path: "ancestors",
              component: IndividualAncestorsComponent,
              resolve: {
                gedcom: () =>
                  newGedcomResourceValue({
                    gedcomDatabase: ancestryDatabase(),
                  }),
                xref: () => "@I1@",
              },
            },
            {
              path: "sources",
              component: IndividualSourcesComponent,
              resolve: {
                gedcom: () =>
                  newGedcomResourceValue({
                    gedcomDatabase: ancestryDatabase(),
                  }),
                xref: () => "@I1@",
              },
            },
            {
              path: "gedcom",
              component: IndividualGedcomComponent,
              resolve: {
                gedcom: () =>
                  newGedcomResourceValue({
                    gedcomDatabase: ancestryDatabase(),
                  }),
                xref: () => "@I1@",
              },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
      bindings: [
        inputBinding(
          "gedcom",
          computed(() =>
            newGedcomResourceValue({
              gedcomDatabase: ancestryDatabase(),
              rootIndividualXref: rootIndividualXref(),
            }),
          ),
        ),
        inputBinding(
          "individual",
          computed(() => ancestryDatabase().individuals["@I1@"]),
        ),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;

    await TestBed.inject(Router).navigateByUrl("/");
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("hasUnsavedChanges delegates to the edit dialog", () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it("links the FamilySearch person", () => {
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>(
      'a[href^="https://www.familysearch.org/"]',
    );
    expect(link?.href).toBe(
      "https://www.familysearch.org/tree/person/details/KWCB-QS1",
    );
    expect(link?.textContent).toContain("FamilySearch: KWCB-QS1");
  });

  describe("relationship to the root person", () => {
    const relationshipText = () => {
      const heading = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll("h2"),
      ).find((h2) => h2.textContent.includes("Relationship"));
      return heading?.nextElementSibling?.textContent
        .replace(/\s+/g, " ")
        .trim();
    };

    const setRoot = async (xref: string | undefined) => {
      rootIndividualXref.set(xref);
      await fixture.whenStable();
    };

    it("asks for a root person when none is chosen", async () => {
      await setRoot(undefined);
      expect(relationshipText()).toBe(
        "Choose a root person in Settings to see how this person is related to them.",
      );
    });

    it("names the relationship from the root person", async () => {
      await setRoot("@I3@");
      expect(relationshipText()).toBe("Father of Baby Doe");
    });

    it("says when this is the root person", async () => {
      await setRoot("@I1@");
      expect(relationshipText()).toBe("This is the root person.");
    });

    it("says when no relationship is found", async () => {
      ancestryDatabase.update((database) => ({
        ...database,
        individuals: {
          ...database.individuals,
          "@I4@": newGedcomIndividual({ xref: "@I4@" }),
        },
      }));
      await setRoot("@I4@");
      expect(relationshipText()).toBe("No relationship to @I4@ found.");
    });
  });
});
