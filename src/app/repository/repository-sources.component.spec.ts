import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { RepositorySourcesComponent } from "./repository-sources.component";

describe("RepositorySourcesComponent", () => {
  let component: RepositorySourcesComponent;
  let fixture: ComponentFixture<RepositorySourcesComponent>;

  beforeEach(async () => {
    const renderResult = await render(RepositorySourcesComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("xref", signal("@R1@"))],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
