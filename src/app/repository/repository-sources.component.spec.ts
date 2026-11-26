import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { RepositorySourcesComponent } from "./repository-sources.component";

describe("RepositorySourcesComponent", () => {
  let component: RepositorySourcesComponent;
  let fixture: ComponentFixture<RepositorySourcesComponent>;

  beforeEach(async () => {
    const repositoryLinks = [
      newGedcomRepositoryLink({ repositoryXref: "@R1@" }),
    ];
    const renderResult = await render(RepositorySourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("xref", signal("@R1@")),
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              sources: {
                "@S1@": newGedcomSource({
                  xref: "@S1@",
                  abbr: "Parish register",
                  repositoryLinks,
                }),
                "@S2@": newGedcomSource({ xref: "@S2@", repositoryLinks }),
                "@S3@": newGedcomSource({
                  xref: "@S3@",
                  abbr: "baptisms",
                  repositoryLinks,
                }),
                "@S4@": newGedcomSource({
                  xref: "@S4@",
                  abbr: "Census",
                  repositoryLinks,
                }),
              },
            }),
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

  it("orders sources by their displayed label", () => {
    expect(
      screen.getAllByRole("link").map((link) => link.textContent.trim()),
    ).toEqual(["@S2@", "baptisms", "Census", "Parish register"]);
  });
});
