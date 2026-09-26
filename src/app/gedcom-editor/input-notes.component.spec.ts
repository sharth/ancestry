import { inputBinding, signal } from "@angular/core";
import {
  DeferBlockBehavior,
  type ComponentFixture,
} from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputNotesComponent } from "./input-notes.component";

describe("InputNotesComponent", () => {
  let fixture: ComponentFixture<InputNotesComponent>;
  let component: InputNotesComponent;

  beforeEach(async () => {
    const renderResult = await render(InputNotesComponent, {
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
