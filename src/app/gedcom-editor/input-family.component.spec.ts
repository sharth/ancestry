import { Component, input, inputBinding, signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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
import { InputFamilyComponent } from "./input-family.component";

const database = newGedcomDatabase({
  individuals: {
    "@I1@": newGedcomIndividual({
      xref: "@I1@",
      names: [newGedcomName({ givenName: "Husband", surname: "Test" })],
      sex: newGedcomSex({ sex: "M" }),
      parentOfFamilyXrefs: ["@F1@"],
    }),
    "@I2@": newGedcomIndividual({
      xref: "@I2@",
      names: [newGedcomName({ givenName: "Wife", surname: "Test" })],
      sex: newGedcomSex({ sex: "F" }),
      parentOfFamilyXrefs: ["@F1@"],
    }),
    "@I3@": newGedcomIndividual({
      xref: "@I3@",
      names: [newGedcomName({ givenName: "Child", surname: "Test" })],
      sex: newGedcomSex({ sex: "F" }),
      childOfFamilyXrefs: ["@F1@"],
    }),
    "@I4@": newGedcomIndividual({
      xref: "@I4@",
      names: [newGedcomName({ givenName: "Other", surname: "Test" })],
      sex: newGedcomSex({ sex: "F" }),
    }),
  },
  families: {
    "@F1@": newGedcomFamily({
      xref: "@F1@",
      husbandXref: "@I1@",
      wifeXref: "@I2@",
      childXrefs: ["@I3@"],
    }),
    "@F2@": newGedcomFamily({ xref: "@F2@" }),
  },
});

@Component({
  imports: [FormField, InputFamilyComponent],
  template: `<app-input-family [formField]="form" [xref]="xref()" />`,
})
class HostComponent {
  readonly xref = input.required<string>();
  readonly workingDatabase = signal(database);
  readonly form = form(this.workingDatabase);
}

// A family's HUSB/WIFE/CHIL and each individual's FAMS/FAMC must agree, or
// parseGedcomDatabase throws the next time the file loads. The family
// editor owns membership, so it updates both sides together.
describe("InputFamilyComponent", () => {
  async function renderFamily(xref: string) {
    const { fixture } = await render(HostComponent, {
      bindings: [inputBinding("xref", () => xref)],
      waitForStableOnRender: true,
    });
    return fixture.componentInstance;
  }

  // Round-trips through GEDCOM text, which throws on mismatched links.
  function reload(edited: GedcomDatabase): GedcomDatabase {
    const text = serializeGedcomDatabase([], database, edited).join("\n");
    return parseGedcomDatabase(parseGedcomRecords(text));
  }

  it("labels the husband and wife pickers", async () => {
    await renderFamily("@F1@");

    // Each label must point at its own picker, not the first one on the page.
    const husband = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Husband",
    });
    const wife = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Wife",
    });
    expect(husband.value).toBe("@I1@");
    expect(wife.value).toBe("@I2@");
  });

  it("drops FAMC from a child removed from the family, and marks the form dirty", async () => {
    const host = await renderFamily("@F1@");
    expect(host.form().dirty()).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Remove child" }));

    const reloaded = reload(host.workingDatabase());
    expect(reloaded.families["@F1@"]?.childXrefs).toEqual([]);
    expect(reloaded.individuals["@I3@"]?.childOfFamilyXrefs).toEqual([]);
    expect(host.form().dirty()).toBe(true);
  });

  it("moves FAMS from the old wife to the new one", async () => {
    const host = await renderFamily("@F1@");

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Wife" }),
      "@I4@",
    );

    const reloaded = reload(host.workingDatabase());
    expect(reloaded.families["@F1@"]?.wifeXref).toBe("@I4@");
    expect(reloaded.individuals["@I2@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(reloaded.individuals["@I4@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
  });

  it("adds FAMS and FAMC for the members of a new family", async () => {
    const host = await renderFamily("@F2@");

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Husband" }),
      "@I1@",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add child" }));
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Child" }),
      "@I4@",
    );

    const reloaded = reload(host.workingDatabase());
    expect(reloaded.families["@F2@"]?.husbandXref).toBe("@I1@");
    expect(reloaded.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([
      "@F1@",
      "@F2@",
    ]);
    expect(reloaded.individuals["@I4@"]?.childOfFamilyXrefs).toEqual(["@F2@"]);
  });
});

describe("InputFamilyComponent shown on a spouse's own editor", () => {
  it("leaves out that spouse's picker", async () => {
    await render(InputFamilyComponent, {
      bindings: [
        inputBinding("value", signal(database)),
        inputBinding("xref", signal("@F1@")),
        inputBinding("spouseXref", signal("@I1@")),
      ],
      waitForStableOnRender: true,
    });

    expect(screen.queryByText("Husband", { selector: "label" })).toBeNull();
    expect(screen.getByText("Wife", { selector: "label" })).toBeTruthy();
  });
});
