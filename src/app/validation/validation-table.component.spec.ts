import { Component, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it, vi } from "vitest";

import {
  AncestryService,
  newGedcomResourceValue,
} from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

interface Row extends ValidationRow {
  name: string;
}

const fixedDatabase = newGedcomDatabase({
  sources: { "@S1@": newGedcomSource({ xref: "@S1@", title: "Fixed" }) },
});
const allFixedDatabase = newGedcomDatabase();

@Component({
  imports: [ValidationTableComponent],
  template: `
    <app-validation-table
      [columns]="['Name']"
      [rows]="rows()"
      [fixAll]="fixAll()"
    >
      <ng-template let-row>
        <div role="cell">{{ row.name }}</div>
      </ng-template>
    </app-validation-table>
  `,
})
class HostComponent {
  readonly rows = signal<Row[]>([
    {
      key: "a",
      name: "Fixable",
      fixedDatabase,
      editorTabs: [{ type: "SOUR", xref: "@S1@" }],
    },
    { key: "b", name: "Not fixable" },
  ]);
  readonly fixAll = signal<(() => GedcomDatabase) | undefined>(
    () => allFixedDatabase,
  );
}

// The table's own column headers, leaving out the diff previews' headers.
function headers() {
  return Array.from(
    document.querySelectorAll('.header-row > [role="columnheader"]'),
  ).map((header) => header.textContent.trim());
}

// The file loaded when a fix is submitted.
const loadedDatabase = newGedcomDatabase();

describe("ValidationTableComponent", () => {
  async function setup() {
    const { fixture } = await render(HostComponent, {
      waitForStableOnRender: true,
    });
    const table = fixture.debugElement.query(
      (element) =>
        element.componentInstance instanceof ValidationTableComponent,
    ).componentInstance as ValidationTableComponent<Row>;
    const ancestryService = TestBed.inject(AncestryService);
    const requestWritePermissionSpy = vi
      .spyOn(ancestryService, "requestWritePermission")
      .mockResolvedValue(true);
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);
    return {
      fixture,
      table,
      ancestryService,
      requestWritePermissionSpy,
      updateGedcomDatabaseSpy,
    };
  }

  it("renders the tab's cells, with a Fix column for rows with a fix", async () => {
    await setup();
    expect(headers()).toEqual(["Name", "Fix"]);
    expect(screen.getByText("Fixable")).toBeTruthy();
    expect(screen.getByText("Not fixable")).toBeTruthy();
    // Only the fixable row gets the buttons.
    expect(
      screen.getAllByRole("button", { name: "Submit changes as proposed" }),
    ).toHaveLength(1);
  });

  it("leaves out the Fix column when no row has a fix", async () => {
    const { fixture } = await setup();
    fixture.componentInstance.rows.set([{ key: "b", name: "Not fixable" }]);
    fixture.componentInstance.fixAll.set(undefined);
    await fixture.whenStable();
    expect(headers()).toEqual(["Name"]);
  });

  it("opens the editor dialog on the row's fixed database and records", async () => {
    const { table } = await setup();
    const showModalSpy = vi
      .spyOn(table.editDialog(), "showModal")
      .mockResolvedValue(undefined);

    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();

    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(table.reviewing()?.fixedDatabase).toBe(fixedDatabase);
    expect(table.reviewing()?.editorTabs).toEqual([
      { type: "SOUR", xref: "@S1@" },
    ]);
  });

  it("submits a row's fix directly", async () => {
    const { ancestryService, updateGedcomDatabaseSpy } = await setup();
    ancestryService.gedcomResource.set(
      newGedcomResourceValue({ gedcomDatabase: loadedDatabase }),
    );
    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalledWith(
        loadedDatabase,
        fixedDatabase,
      );
    });
  });

  it("submits every fix at once", async () => {
    const { ancestryService, updateGedcomDatabaseSpy } = await setup();
    ancestryService.gedcomResource.set(
      newGedcomResourceValue({ gedcomDatabase: loadedDatabase }),
    );
    screen.getByRole("button", { name: "Submit all 1 as proposed" }).click();
    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalledWith(
        loadedDatabase,
        allFixedDatabase,
      );
    });
  });

  it("saves nothing when write permission is denied", async () => {
    const { table, requestWritePermissionSpy, updateGedcomDatabaseSpy } =
      await setup();
    requestWritePermissionSpy.mockResolvedValue(false);
    await table.submit(fixedDatabase);
    expect(updateGedcomDatabaseSpy).not.toHaveBeenCalled();
  });

  // The preview goes through the same diff the save path writes from, so
  // it can't drift from what actually gets written to disk.
  it("builds each preview from AncestryService.gedcomDatabaseDifferences", async () => {
    const { table, ancestryService } = await setup();
    const differencesSpy = vi.spyOn(
      ancestryService,
      "gedcomDatabaseDifferences",
    );
    expect(table.differences()).toHaveLength(2);
    // Already computed during render; reading it again doesn't rebuild.
    expect(differencesSpy).not.toHaveBeenCalled();
    expect(
      table
        .differences()[0]
        ?.some((d) => d.updatedGedcomRecord?.xref === "@S1@"),
    ).toBe(true);
    expect(table.differences()[1]).toEqual([]);
  });

  it("doesn't rebuild the previews on change detection", async () => {
    const { fixture, table, ancestryService } = await setup();
    const differencesSpy = vi.spyOn(
      ancestryService,
      "gedcomDatabaseDifferences",
    );
    // e.g. picking a row to review in the editor dialog.
    vi.spyOn(table.editDialog(), "showModal").mockResolvedValue(undefined);
    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    await fixture.whenStable();
    expect(differencesSpy).not.toHaveBeenCalled();
  });

  it("sticks the header and each row, each row only within its own section", async () => {
    await setup();
    const header = document.querySelector<HTMLElement>(".header-row");
    expect(header && getComputedStyle(header).position).toBe("sticky");
    // One sticky row per section, first in it: a sticky element sticks
    // within its containing block, so each row only ever competes for the
    // top of the page with its own diff, never another row (the bug in
    // #444).
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".row-section"),
    );
    expect(sections).toHaveLength(2);
    for (const section of sections) {
      const stickyRows = Array.from(
        section.querySelectorAll<HTMLElement>(".sticky-row"),
      );
      expect(stickyRows).toHaveLength(1);
      expect(section.firstElementChild).toBe(stickyRows[0]);
      for (const row of stickyRows) {
        expect(getComputedStyle(row).position).toBe("sticky");
      }
    }
  });

  it("hasUnsavedChanges delegates to the editor dialog", async () => {
    const { table } = await setup();
    expect(table.hasUnsavedChanges()).toBe(false);
  });
});
