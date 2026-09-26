import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { SourceRepositoriesComponent } from "./source-repositories.component";

describe("SourceRepositoriesComponent", () => {
  let component: SourceRepositoriesComponent;
  let fixture: ComponentFixture<SourceRepositoriesComponent>;

  beforeEach(async () => {
    const renderResult = await render(SourceRepositoriesComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("xref", signal("@S1@"))],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
