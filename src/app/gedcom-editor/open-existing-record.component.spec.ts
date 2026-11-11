import { inputBinding, outputBinding, signal } from "@angular/core";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import type { TabInformation } from "./gedcom-editor-interface";
import { OpenExistingRecordComponent } from "./open-existing-record.component";

const database = newGedcomDatabase({
  individuals: {
    "@I1@": newGedcomIndividual({
      xref: "@I1@",
      names: [newGedcomName({ givenName: "Mary", surname: "Smith" })],
    }),
    "@I2@": newGedcomIndividual({
      xref: "@I2@",
      names: [newGedcomName({ givenName: "John", surname: "Smith" })],
    }),
  },
  families: {
    "@F1@": newGedcomFamily({
      xref: "@F1@",
      husbandXref: "@I2@",
      wifeXref: "@I1@",
    }),
  },
  sources: {
    "@S1@": newGedcomSource({ xref: "@S1@", abbr: "1880 Census" }),
  },
  repositories: {
    "@R1@": newGedcomRepository({ xref: "@R1@", name: "FamilySearch" }),
  },
  multimedias: {
    "@O1@": newGedcomMultimedia({ xref: "@O1@", title: "Census page" }),
  },
});

async function renderPicker() {
  const opened = vi.fn<(tab: TabInformation) => void>();
  await render(OpenExistingRecordComponent, {
    bindings: [
      inputBinding("workingDatabase", signal(database)),
      outputBinding("opened", opened),
    ],
    waitForStableOnRender: true,
  });
  return opened;
}

function resultLabels(): string[] {
  return screen
    .queryAllByRole("button")
    .map((button) =>
      Array.from(button.querySelectorAll("span"), (span) =>
        span.textContent.trim(),
      ).join(" "),
    );
}

describe("OpenExistingRecordComponent", () => {
  it("lists nothing until something is typed", async () => {
    await renderPicker();
    expect(resultLabels()).toEqual([]);
  });

  it("finds records of every type by name", async () => {
    await renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "census");
    // Prefix matches rank ahead of matches inside the name.
    expect(resultLabels()).toEqual(["Census page @O1@", "1880 Census @S1@"]);
  });

  it("finds families by their spouses' names", async () => {
    await renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "smith &");
    expect(resultLabels()).toEqual(["John Smith & Mary Smith @F1@"]);
  });

  it("finds records by xref, with or without @", async () => {
    await renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "R1");
    expect(resultLabels()).toEqual(["FamilySearch @R1@"]);
  });

  it("says when nothing matches", async () => {
    await renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No matching records")).toBeTruthy();
  });

  it("opens a clicked result and clears the search", async () => {
    const opened = await renderPicker();
    const search = screen.getByRole<HTMLInputElement>("searchbox");
    await userEvent.type(search, "familysearch");
    await userEvent.click(screen.getByRole("button", { name: /FamilySearch/ }));
    expect(opened).toHaveBeenCalledExactlyOnceWith({
      type: "REPO",
      xref: "@R1@",
    });
    expect(search.value).toBe("");
    expect(resultLabels()).toEqual([]);
  });

  it("opens the top result on Enter", async () => {
    const opened = await renderPicker();
    await userEvent.type(screen.getByRole("searchbox"), "mary{Enter}");
    expect(opened).toHaveBeenCalledExactlyOnceWith({
      type: "INDI",
      xref: "@I1@",
    });
  });
});
