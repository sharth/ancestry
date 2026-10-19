import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { SourceOverviewComponent } from "./source-overview.component";

describe("SourceOverviewComponent", () => {
  let component: SourceOverviewComponent;
  let fixture: ComponentFixture<SourceOverviewComponent>;

  beforeEach(async () => {
    const renderResult = await render(SourceOverviewComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              sources: {
                "@S1@": newGedcomSource({
                  xref: "@S1@",
                  title: "Springfield Vital Records",
                  text: "Birth and death records for Springfield.",
                  multimediaLinks: [
                    newGedcomMultimediaLink({
                      xref: "@M1@",
                      title: "Scan of record",
                    }),
                  ],
                  repositoryLinks: [
                    newGedcomRepositoryLink({
                      repositoryXref: "@R1@",
                      callNumbers: ["12345"],
                    }),
                  ],
                }),
              },
              multimedias: {
                "@M1@": newGedcomMultimedia({
                  xref: "@M1@",
                  filePath: "scan.jpg",
                  mediaType: "image/jpeg",
                }),
              },
              repositories: {
                "@R1@": newGedcomRepository({
                  xref: "@R1@",
                  name: "Springfield Hall of Records",
                }),
              },
            }),
          ),
        ),
        inputBinding("xref", signal("@S1@")),
      ],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("includes the multimedia link in the view model", () => {
    const [multimediaLink] = component.vm()?.multimediaLinks ?? [];
    expect(multimediaLink?.xref).toBe("@M1@");
    expect(multimediaLink?.title).toBe("Scan of record");
    expect(multimediaLink?.multimedia?.filePath).toBe("scan.jpg");
  });

  it("includes the repository citation in the view model", () => {
    const [repositoryCitation] = component.vm()?.repositoryCitations ?? [];
    expect(repositoryCitation?.repositoryXref).toBe("@R1@");
    expect(repositoryCitation?.callNumbers).toEqual(["12345"]);
    expect(repositoryCitation?.repository?.name).toBe(
      "Springfield Hall of Records",
    );
  });
});
