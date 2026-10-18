import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { SourceCitationsComponent } from "./source-citations.component";
import { SourceGedcomComponent } from "./source-gedcom.component";
import { SourceOverviewComponent } from "./source-overview.component";
import { SourceRepositoriesComponent } from "./source-repositories.component";
import { SourceComponent } from "./source.component";

describe("SourceComponent", () => {
  let component: SourceComponent;
  let fixture: ComponentFixture<SourceComponent>;

  const ancestryDatabase = signal(
    newGedcomDatabase({
      sources: {
        "@S1@": newGedcomSource({ xref: "@S1@" }),
      },
    }),
  );

  beforeEach(async () => {
    const renderResult = await render(SourceComponent, {
      providers: [
        provideRouter(
          [
            { path: "", redirectTo: "overview", pathMatch: "full" },
            {
              path: "overview",
              component: SourceOverviewComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@S1@",
              },
            },
            {
              path: "citations",
              component: SourceCitationsComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@S1@",
              },
            },
            {
              path: "repositories",
              component: SourceRepositoriesComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@S1@",
              },
            },
            {
              path: "gedcom",
              component: SourceGedcomComponent,
              resolve: {
                ancestryDatabase: () => ancestryDatabase(),
                xref: () => "@S1@",
              },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", signal("@S1@")),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;

    await TestBed.inject(Router).navigateByUrl("/");
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
