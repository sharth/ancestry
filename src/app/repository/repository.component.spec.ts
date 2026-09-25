import { inputBinding } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { RepositoryComponent } from "./repository.component";

describe("RepositoryComponent", () => {
  let component: RepositoryComponent;
  let fixture: ComponentFixture<RepositoryComponent>;

  beforeEach(async () => {
    const ancestryDatabase = newGedcomDatabase({
      repositories: {
        "@R1@": newGedcomRepository({
          xref: "@R1@",
          name: "Test Repository",
        }),
      },
    });

    const renderResult = await render(RepositoryComponent, {
      bindings: [
        inputBinding("ancestryDatabase", () => ancestryDatabase),
        inputBinding("xref", () => "@R1@"),
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
