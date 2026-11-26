import {
  inputBinding,
  signal,
  type WritableSignal,
  computed,
} from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import {
  type GedcomDatabase,
  newGedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { RepositoriesComponent } from "./repositories.component";

describe("RepositoriesComponent", () => {
  let component: RepositoriesComponent;
  let fixture: ComponentFixture<RepositoriesComponent>;
  let ancestryDatabase: WritableSignal<GedcomDatabase>;

  beforeEach(async () => {
    ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(RepositoriesComponent, {
      bindings: [
        inputBinding(
          "gedcom",
          computed(() =>
            newGedcomResourceValue({ gedcomDatabase: ancestryDatabase() }),
          ),
        ),
      ],
      providers: [provideRouter([])],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("lists repositories alphabetically by displayed label", async () => {
    const gedcomDatabase = newGedcomDatabase();
    for (const repository of [
      newGedcomRepository({ xref: "@R1@", name: "Zebra Archives" }),
      newGedcomRepository({ xref: "@R2@" }),
      newGedcomRepository({ xref: "@R3@", name: "ancestry.com" }),
      newGedcomRepository({ xref: "@R4@", name: "Bodleian Library" }),
    ]) {
      gedcomDatabase.repositories[repository.xref] = repository;
    }
    ancestryDatabase.set(gedcomDatabase);
    await fixture.whenStable();

    const links = screen
      .getAllByRole("link")
      .map((link) => link.textContent.trim());
    expect(links).toEqual([
      "@R2@",
      "ancestry.com",
      "Bodleian Library",
      "Zebra Archives",
    ]);
  });
});
