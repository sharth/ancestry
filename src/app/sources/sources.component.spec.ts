import { inputBinding, signal, computed } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { SourcesComponent } from "./sources.component";

describe("RepositoriesComponent", () => {
  let component: SourcesComponent;
  let fixture: ComponentFixture<SourcesComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(SourcesComponent, {
      bindings: [
        inputBinding(
          "gedcom",
          computed(() =>
            newGedcomResourceValue({ gedcomDatabase: ancestryDatabase() }),
          ),
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
