import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { SearchComponent } from "./search.component";

describe("SearchComponent", () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  const database = newGedcomDatabase({
    individuals: {
      I1: newGedcomIndividual({
        xref: "I1",
        names: [newGedcomName({ givenName: "Jane", surname: "Boston" })],
        facts: [newGedcomFact({ tag: "BIRT", place: "Springfield, IL" })],
      }),
      I2: newGedcomIndividual({
        xref: "I2",
        names: [newGedcomName({ givenName: "John", surname: "Smith" })],
      }),
    },
    families: {
      F1: newGedcomFamily({ xref: "F1", husbandXref: "I2", wifeXref: "I1" }),
    },
    sources: {
      S1: newGedcomSource({ xref: "S1", title: "Boston Vital Records" }),
    },
    repositories: {
      R1: newGedcomRepository({ xref: "R1", name: "Boston Archive" }),
    },
  });

  async function renderSearch(query: string) {
    const renderResult = await render(SearchComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(database)),
        inputBinding("q", signal(query)),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  }

  it("creates with no query", async () => {
    await renderSearch("");
    expect(component).toBeTruthy();
    expect(screen.getByText(/Type something/i)).toBeTruthy();
  });

  it("matches individuals, families, sources, repositories, and places by substring", async () => {
    await renderSearch("boston");

    expect(component.vm().individuals.map((r) => r.xref)).toEqual(["I1"]);
    expect(component.vm().families.map((r) => r.xref)).toEqual(["F1"]);
    expect(component.vm().sources.map((r) => r.xref)).toEqual(["S1"]);
    expect(component.vm().repositories.map((r) => r.xref)).toEqual(["R1"]);
    expect(component.vm().places).toEqual([]);
  });

  it("finds places by name", async () => {
    await renderSearch("springfield");

    expect(component.vm().places.map((r) => r.label)).toEqual([
      "Springfield, IL",
    ]);
  });

  it("reports no results for a non-matching query", async () => {
    await renderSearch("nonexistent");

    const vm = component.vm();
    expect(
      vm.individuals.length +
        vm.families.length +
        vm.sources.length +
        vm.repositories.length +
        vm.multimedias.length +
        vm.places.length,
    ).toBe(0);
    expect(screen.getByText(/No results/i)).toBeTruthy();
  });
});
