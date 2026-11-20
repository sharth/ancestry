import { inputBinding, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  AncestryService,
  newGedcomResourceValue,
} from "../../database/ancestry.service";
import { newGedcomRecord, parseGedcomRecords } from "../../gedcom/gedcomRecord";
import { HistoryComponent, differingGedcomRecords } from "./history.component";

const OLD_TEXT = ["0 HEAD", "0 @I1@ INDI", "1 NAME John /Doe/", "0 TRLR"].join(
  "\n",
);
const NEW_TEXT = ["0 HEAD", "0 @I1@ INDI", "1 NAME Jack /Doe/", "0 TRLR"].join(
  "\n",
);

describe("differingGedcomRecords", () => {
  it("pairs records by tag, xref and value, keeping only differences", () => {
    const same = newGedcomRecord({ tag: "HEAD" });
    const oldIndividual = newGedcomRecord({ xref: "@I1@", tag: "INDI" });
    const newIndividual = newGedcomRecord({
      xref: "@I1@",
      tag: "INDI",
      children: [newGedcomRecord({ tag: "SEX", value: "M" })],
    });
    const removed = newGedcomRecord({ xref: "@S1@", tag: "SOUR" });
    const added = newGedcomRecord({ xref: "@R1@", tag: "REPO" });

    expect(
      differingGedcomRecords(
        [same, oldIndividual, removed],
        [same, newIndividual, added],
      ),
    ).toEqual([
      { oldGedcomRecord: oldIndividual, newGedcomRecord: newIndividual },
      { oldGedcomRecord: removed },
      { newGedcomRecord: added },
    ]);
  });
});

describe("HistoryComponent", () => {
  let ancestryService: AncestryService;
  const fileHandle = { name: "tree.ged" } as FileSystemFileHandle;

  // Renders the page, then fills the save history, which the page picks
  // up live. (TestBed can't be injected from before render().)
  async function setup(
    gedcom = newGedcomResourceValue({
      gedcomFileHandle: fileHandle,
      gedcomRecords: parseGedcomRecords(NEW_TEXT),
    }),
  ) {
    await render(HistoryComponent, {
      bindings: [inputBinding("gedcom", signal(gedcom))],
      waitForStableOnRender: true,
    });
    ancestryService = TestBed.inject(AncestryService);
    await ancestryService.dexieDatabase.saves.clear();
    await ancestryService.dexieDatabase.saves.bulkAdd([
      {
        savedAt: new Date(2026, 10, 1, 9, 0),
        gedcomFilename: "tree.ged",
        gedcomText: OLD_TEXT,
      },
      {
        savedAt: new Date(2026, 10, 2, 9, 0),
        gedcomFilename: "other.ged",
        gedcomText: OLD_TEXT,
      },
    ]);
  }

  it("lists only this file's saves", async () => {
    await setup();

    expect(await screen.findByText(/Nov 1, 2026/)).toBeTruthy();
    expect(screen.queryByText(/Nov 2, 2026/)).toBeNull();
  });

  it("shows the differences from the current file", async () => {
    await setup();

    await userEvent.click(
      await screen.findByRole("button", { name: "Show differences" }),
    );

    expect(await screen.findByText("1 NAME John /Doe/")).toBeTruthy();
    expect(screen.getByText("1 NAME Jack /Doe/")).toBeTruthy();
  });

  it("restores a save", async () => {
    await setup();
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(true);
    const restoreSpy = vi
      .spyOn(ancestryService, "restoreGedcomSave")
      .mockResolvedValue();

    await userEvent.click(
      await screen.findByRole("button", { name: "Restore" }),
    );

    await vi.waitFor(() => {
      expect(restoreSpy).toHaveBeenCalledOnce();
    });
  });

  it("explains that the example data has no history", async () => {
    await setup(newGedcomResourceValue());

    expect(screen.getByText(/example data can't be saved/)).toBeTruthy();
  });
});
