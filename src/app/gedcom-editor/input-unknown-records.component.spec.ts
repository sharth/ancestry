import { inputBinding, signal } from "@angular/core";
import {
  DeferBlockBehavior,
  type ComponentFixture,
} from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

describe("InputUnknownRecordsComponent", () => {
  let fixture: ComponentFixture<InputUnknownRecordsComponent>;
  let component: InputUnknownRecordsComponent;

  const workingDatabase = signal(newGedcomDatabase());

  beforeEach(async () => {
    const renderResult = await render(InputUnknownRecordsComponent, {
      bindings: [inputBinding("workingDatabase", workingDatabase)],
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
