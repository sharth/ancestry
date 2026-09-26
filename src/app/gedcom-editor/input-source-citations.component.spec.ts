import { inputBinding, signal } from "@angular/core";
import {
  DeferBlockBehavior,
  type ComponentFixture,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

describe("InputSourceCitationsComponent", () => {
  let fixture: ComponentFixture<InputSourceCitationsComponent>;
  let component: InputSourceCitationsComponent;

  beforeEach(async () => {
    const renderResult = await render(InputSourceCitationsComponent, {
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
});
