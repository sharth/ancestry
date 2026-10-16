import { inputBinding, signal } from "@angular/core";
import {
  DeferBlockBehavior,
  type ComponentFixture,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";

describe("InputMultimediaLinksComponent", () => {
  let fixture: ComponentFixture<InputMultimediaLinksComponent>;
  let component: InputMultimediaLinksComponent;

  beforeEach(async () => {
    const renderResult = await render(InputMultimediaLinksComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      configureTestBed: (testBed) => {
        testBed.configureTestingModule({
          deferBlockBehavior: DeferBlockBehavior.Playthrough,
        });
      },
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("setCrop updates only the targeted link", () => {
    component.appendMultimediaLink();
    component.appendMultimediaLink();
    component.setCrop(1, { top: 1, left: 2, height: 3, width: 4 });
    expect(component.value()[0]?.crop).toBeUndefined();
    expect(component.value()[1]?.crop).toEqual({
      top: 1,
      left: 2,
      height: 3,
      width: 4,
    });
  });
});
