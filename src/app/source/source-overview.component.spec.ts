import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { MultimediaPreviewComponent } from "../multimedia/multimedia-preview.component";
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
                      crop: { top: 10, left: 20, height: 30, width: 40 },
                    }),
                    newGedcomMultimediaLink({ xref: "@M2@" }),
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
                  title: "Original record title",
                }),
                "@M2@": newGedcomMultimedia({
                  xref: "@M2@",
                  filePath: "certificate.jpg",
                  title: "Death certificate",
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

  it("falls back to the multimedia record's title when the link has none", () => {
    const [, multimediaLink] = component.vm()?.multimediaLinks ?? [];
    expect(multimediaLink?.xref).toBe("@M2@");
    expect(multimediaLink?.title).toBe("Death certificate");
  });

  it("shows a card with a preview for each multimedia link", () => {
    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll(".card");
    expect(cards).toHaveLength(2);
    const link = cards[0]?.querySelector(".card-header a");
    expect(link?.textContent.trim()).toBe("Scan of record");
    expect(link?.getAttribute("href")).toBe("/multimedia/@M1@");
    expect(cards[0]?.querySelector("app-multimedia-preview")).toBeTruthy();
  });

  it("passes each link's crop to its preview", () => {
    const [cropped, uncropped] = component.vm()?.multimediaLinks ?? [];
    expect(cropped?.crop).toEqual({ top: 10, left: 20, height: 30, width: 40 });
    expect(uncropped?.crop).toEqual({});
    const previews = fixture.debugElement.queryAll(
      By.directive(MultimediaPreviewComponent),
    );
    expect(
      previews.map((preview) =>
        (preview.componentInstance as MultimediaPreviewComponent).crop(),
      ),
    ).toEqual([{ top: 10, left: 20, height: 30, width: 40 }, {}]);
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
