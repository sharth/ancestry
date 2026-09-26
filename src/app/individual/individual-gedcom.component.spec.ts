import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { IndividualGedcomComponent } from "./individual-gedcom.component";

describe("IndividualGedcomComponent", () => {
  let component: IndividualGedcomComponent;
  let fixture: ComponentFixture<IndividualGedcomComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
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
              }),
            ],
          }),
        },
      }),
    );
    const xref = signal("@I1@");

    const renderResult = await render(IndividualGedcomComponent, {
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", xref),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  it("should create", () => {
    assert.isOk(component);
  });

  it("should display gedcom heading and gedcom-display component", () => {
    const heading = element.querySelector("h2");
    assert.isOk(heading);
    assert.equal(heading.textContent, "Gedcom");

    const gedcomDisplay = element.querySelector("app-gedcom-display");
    assert.isOk(gedcomDisplay);
  });

  it("matches screenshot", async () => {
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });
});
