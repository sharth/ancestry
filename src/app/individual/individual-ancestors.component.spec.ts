import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";

describe("IndividualAncestorsComponent", () => {
  let component: IndividualAncestorsComponent;
  let fixture: ComponentFixture<IndividualAncestorsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const ancestryDatabase = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          names: [newGedcomName({ givenName: "John", surname: "Doe" })],
          sex: newGedcomSex({ sex: "M" }),
          childOfFamilyXrefs: ["@F1@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          names: [newGedcomName({ givenName: "James", surname: "Doe" })],
          sex: newGedcomSex({ sex: "M" }),
          childOfFamilyXrefs: ["@F2@"],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I3@": newGedcomIndividual({
          xref: "@I3@",
          names: [newGedcomName({ givenName: "Mary", surname: "Smith" })],
          sex: newGedcomSex({ sex: "F" }),
          childOfFamilyXrefs: ["@F3@"],
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I4@": newGedcomIndividual({
          xref: "@I4@",
          names: [newGedcomName({ givenName: "William", surname: "Doe" })],
          sex: newGedcomSex({ sex: "M" }),
          parentOfFamilyXrefs: ["@F2@"],
        }),
        "@I5@": newGedcomIndividual({
          xref: "@I5@",
          names: [newGedcomName({ givenName: "Elizabeth", surname: "Brown" })],
          sex: newGedcomSex({ sex: "F" }),
          parentOfFamilyXrefs: ["@F2@"],
        }),
        "@I6@": newGedcomIndividual({
          xref: "@I6@",
          names: [newGedcomName({ givenName: "Robert", surname: "Smith" })],
          sex: newGedcomSex({ sex: "M" }),
          parentOfFamilyXrefs: ["@F3@"],
        }),
        "@I7@": newGedcomIndividual({
          xref: "@I7@",
          names: [newGedcomName({ givenName: "Margaret", surname: "Jones" })],
          sex: newGedcomSex({ sex: "F" }),
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
