import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { MultimediaSourcesComponent } from "./multimedia-sources.component";

describe("MultimediaSourcesComponent", () => {
  it("lists only the sources that link to the multimedia", async () => {
    await render(MultimediaSourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              sources: {
                "@S1@": newGedcomSource({
                  xref: "@S1@",
                  abbr: "Linked source",
                  multimediaLinks: [newGedcomMultimediaLink({ xref: "@M1@" })],
                }),
                "@S2@": newGedcomSource({
                  xref: "@S2@",
                  abbr: "Other source",
                  multimediaLinks: [newGedcomMultimediaLink({ xref: "@M2@" })],
                }),
              },
            }),
          ),
        ),
        inputBinding("xref", signal("@M1@")),
      ],
      waitForStableOnRender: true,
    });

    const link = screen.getByRole("link", { name: "Linked source" });
    expect(link.getAttribute("href")).toBe("/source/@S1@");
    expect(screen.queryByText("Other source")).toBeNull();
  });

  it("says when no source links to the multimedia", async () => {
    await render(MultimediaSourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(newGedcomDatabase())),
        inputBinding("xref", signal("@M1@")),
      ],
      waitForStableOnRender: true,
    });

    expect(
      screen.getByText("No sources link to this multimedia."),
    ).toBeTruthy();
  });
});
