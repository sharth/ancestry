import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualFactsComponent } from "./individual-facts.component";

describe("IndividualFactsComponent", () => {
  let component: IndividualFactsComponent;
  let fixture: ComponentFixture<IndividualFactsComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            facts: [
              newGedcomFact({
                tag: "BIRT",
                date: newGedcomDate({ value: "1 JAN 1900" }),
                place: "Some Place",
                sortDate: newGedcomDate({ value: "1900" }),
              }),
            ],
            parentOfFamilyXrefs: ["@F1@"],
          }),
        },
        families: {
          "@F1@": newGedcomFamily({
            xref: "@F1@",
            husbandXref: "@I1@",
          }),
        },
      }),
    );
    const xref = signal("@I1@");

    const renderResult = await render(IndividualFactsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", xref),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render events and relatives sections", () => {
    const element = fixture.nativeElement as HTMLElement;
    const headings = Array.from(element.querySelectorAll("h2")).map(
      (h) => h.textContent,
    );
    expect(headings).toContain("Events");
    expect(headings).toContain("Events for Family @F1@");
    expect(headings).toContain("Relatives");
  });
});
