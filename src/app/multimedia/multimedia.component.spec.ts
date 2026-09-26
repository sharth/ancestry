import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { MultimediaComponent } from "./multimedia.component";

describe("MultimediaComponent", () => {
  let component: MultimediaComponent;
  let fixture: ComponentFixture<MultimediaComponent>;

  beforeEach(async () => {
    const renderResult = await render(MultimediaComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              multimedias: { "@M1@": newGedcomMultimedia({ xref: "@M1@" }) },
            }),
          ),
        ),
        inputBinding("xref", signal("@M1@")),
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
