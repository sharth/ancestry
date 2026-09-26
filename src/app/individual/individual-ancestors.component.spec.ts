import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";

function individual(
  xref: string,
  givenName: string,
  surname: string,
  sex: string,
  extraFields: Partial<GedcomIndividual> = {},
) {
  return newGedcomIndividual({
    xref,
    names: [newGedcomName({ givenName, surname })],
    sex: newGedcomSex({ sex }),
    ...extraFields,
  });
}

describe("IndividualAncestorsComponent", () => {
  let component: IndividualAncestorsComponent;
  let fixture: ComponentFixture<IndividualAncestorsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const ancestryDatabase = newGedcomDatabase({
      individuals: {
        "@I1@": individual("@I1@", "John", "Doe", "M", {
          childOfFamilyXrefs: ["@F1@"],
        }),
        "@I2@": individual("@I2@", "James", "Doe", "M", {
          childOfFamilyXrefs: ["@F2@"],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I3@": individual("@I3@", "Mary", "Smith", "F", {
          childOfFamilyXrefs: ["@F3@"],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I4@": individual("@I4@", "William", "Doe", "M", {
          parentOfFamilyXrefs: ["@F2@"],
        }),
        "@I5@": individual("@I5@", "Elizabeth", "Brown", "F", {
          parentOfFamilyXrefs: ["@F2@"],
        }),
        "@I6@": individual("@I6@", "Robert", "Smith", "M", {
          parentOfFamilyXrefs: ["@F3@"],
        }),
        "@I7@": individual("@I7@", "Margaret", "Jones", "F", {
          parentOfFamilyXrefs: ["@F3@"],
        }),
      },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          husbandXref: "@I2@",
          wifeXref: "@I3@",
          childXrefs: ["@I1@"],
        }),
        "@F2@": newGedcomFamily({
          xref: "@F2@",
          husbandXref: "@I4@",
          wifeXref: "@I5@",
          childXrefs: ["@I2@"],
        }),
        "@F3@": newGedcomFamily({
          xref: "@F3@",
          husbandXref: "@I6@",
          wifeXref: "@I7@",
          childXrefs: ["@I3@"],
        }),
      },
    });

    const renderResult = await render(IndividualAncestorsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(ancestryDatabase)),
        inputBinding("xref", signal("@I1@")),
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
