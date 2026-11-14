import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { IndividualsComponent } from "./individuals.component";

describe("IndividualsComponent", () => {
  let component: IndividualsComponent;
  let fixture: ComponentFixture<IndividualsComponent>;

  beforeEach(async () => {
    const renderResult = await render(IndividualsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal({
            dataSource: { mode: "builtin" },
            gedcomFileHandle: undefined,
            gedcomFile: undefined,
            gedcomText: "",
            gedcomRecords: [],
            gedcomDatabase: newGedcomDatabase(),
            directoryHandle: undefined,
          }),
        ),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
