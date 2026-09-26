import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { MultimediaCitationsComponent } from "./multimedia-citations.component";

describe("MultimediaCitationsComponent", () => {
  let component: MultimediaCitationsComponent;
  let fixture: ComponentFixture<MultimediaCitationsComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(newGedcomDatabase());
    const xref = signal("@M1@");

    const renderResult = await render(MultimediaCitationsComponent, {
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
});
