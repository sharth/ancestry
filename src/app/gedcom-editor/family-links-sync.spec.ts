import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import {
  type GedcomDatabase,
  newGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { parseGedcomRecords } from "../../gedcom/gedcomRecord";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import type { TabInformation } from "./gedcom-editor-interface";
import { GedcomEditorComponent } from "./gedcom-editor.component";

// Regression tests: a family's HUSB/WIFE/CHIL and each individual's FAMS/FAMC
// must agree, or parseGedcomDatabase throws the next time the file loads.
// The family editor owns membership, so saving a family edit has to bring
// the individuals' FAMS/FAMC along with it.
describe("GedcomEditorComponent keeps FAMS/FAMC in sync with family edits", () => {
  function individual(
    xref: string,
    givenName: string,
    sex: string,
    links: { fams?: string[]; famc?: string[] } = {},
  ) {
    return newGedcomIndividual({
      xref,
      names: [newGedcomName({ givenName, surname: "Test" })],
      sex: newGedcomSex({ sex }),
      parentOfFamilyXrefs: links.fams ?? [],
      childOfFamilyXrefs: links.famc ?? [],
    });
  }

  const database = newGedcomDatabase({
    individuals: {
      "@I1@": individual("@I1@", "Husband", "M", { fams: ["@F1@"] }),
      "@I2@": individual("@I2@", "Wife", "F", { fams: ["@F1@"] }),
      "@I3@": individual("@I3@", "Child", "F", { famc: ["@F1@"] }),
      "@I4@": individual("@I4@", "Other", "F"),
    },
    families: {
      "@F1@": newGedcomFamily({
        xref: "@F1@",
        husbandXref: "@I1@",
        wifeXref: "@I2@",
        childXrefs: ["@I3@"],
      }),
    },
  });

  async function renderEditor(tab: TabInformation) {
    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    renderResult.fixture.componentRef.setInput("tabs", [tab]);
    renderResult.fixture.componentRef.setInput("ancestryDatabase", database);
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();
    return renderResult;
  }

  // Submits the editor and returns what was saved, after a round trip
  // through GEDCOM text, which throws on mismatched links.
  async function submitAndReload(
    renderResult: Awaited<ReturnType<typeof renderEditor>>,
  ): Promise<GedcomDatabase> {
    const save = vi
      .spyOn(TestBed.inject(AncestryService), "updateGedcomDatabase")
      .mockResolvedValue(undefined);
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();
    await renderResult.fixture.componentInstance.submitForm(
      new Event("submit"),
    );
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0]?.[0];
    assert.isOk(saved);
    const text = serializeGedcomDatabase([], database, saved).join("\n");
    return parseGedcomDatabase(parseGedcomRecords(text));
  }

  it("drops FAMC from a child removed from the family", async () => {
    const renderResult = await renderEditor({ type: "FAM", xref: "@F1@" });

    await userEvent.click(screen.getByRole("button", { name: "Remove child" }));

    const reloaded = await submitAndReload(renderResult);
    expect(reloaded.families["@F1@"]?.childXrefs).toEqual([]);
    expect(reloaded.individuals["@I3@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("moves FAMS from the old wife to the new one", async () => {
    const renderResult = await renderEditor({ type: "FAM", xref: "@F1@" });

    const [, wifeSelect] = screen.getAllByRole<HTMLSelectElement>("combobox");
    assert.isOk(wifeSelect);
    await userEvent.selectOptions(wifeSelect, "@I4@");

    const reloaded = await submitAndReload(renderResult);
    expect(reloaded.families["@F1@"]?.wifeXref).toBe("@I4@");
    expect(reloaded.individuals["@I2@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(reloaded.individuals["@I4@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
  });

  it("adds FAMS and FAMC for the members of a new family", async () => {
    const renderResult = await renderEditor({ type: "FAM", xref: "" });

    const [husbandSelect] = screen.getAllByRole<HTMLSelectElement>("combobox");
    assert.isOk(husbandSelect);
    await userEvent.selectOptions(husbandSelect, "@I1@");
    await userEvent.click(screen.getByRole("button", { name: "Add child" }));
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();
    const childSelect = screen.getAllByRole<HTMLSelectElement>("combobox")[2];
    assert.isOk(childSelect);
    await userEvent.selectOptions(childSelect, "@I4@");

    const reloaded = await submitAndReload(renderResult);
    expect(reloaded.families["@F2@"]?.husbandXref).toBe("@I1@");
    expect(reloaded.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([
      "@F1@",
      "@F2@",
    ]);
    expect(reloaded.individuals["@I4@"]?.childOfFamilyXrefs).toEqual(["@F2@"]);
  });
});
