import { Component, input, inputBinding, signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, describe, expect, it } from "vitest";

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
    "@F2@": newGedcomFamily({ xref: "@F2@" }),
  },
});

@Component({
  imports: [FormField, InputFamilyComponent],
  template: `<app-input-family
    [workingDatabase]="workingDatabase()"
    [formField]="form"
    [xref]="xref()"
  />`,
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

    expect(screen.getByLabelText("Husband")).toBeTruthy();
    expect(screen.getByLabelText("Wife")).toBeTruthy();
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

    // By position: every picker's <select> has id="individual", so its
    // label only finds the first one.
    const [, wifeSelect] = screen.getAllByRole<HTMLSelectElement>("combobox");
    assert.isOk(wifeSelect);
    await userEvent.selectOptions(wifeSelect, "@I4@");

    const reloaded = reload(host.workingDatabase());
    expect(reloaded.families["@F1@"]?.wifeXref).toBe("@I4@");
    expect(reloaded.individuals["@I2@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(reloaded.individuals["@I4@"]?.parentOfFamilyXrefs).toEqual(["@F1@"]);
  });

  it("adds FAMS and FAMC for the members of a new family", async () => {
    const host = await renderFamily("@F2@");

    const [husbandSelect] = screen.getAllByRole<HTMLSelectElement>("combobox");
    assert.isOk(husbandSelect);
    await userEvent.selectOptions(husbandSelect, "@I1@");
    await userEvent.click(screen.getByRole("button", { name: "Add child" }));
    const childSelect = screen.getAllByRole<HTMLSelectElement>("combobox")[2];
    assert.isOk(childSelect);
    await userEvent.selectOptions(childSelect, "@I4@");

    const reloaded = reload(host.workingDatabase());
    expect(reloaded.families["@F2@"]?.husbandXref).toBe("@I1@");
    expect(reloaded.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([
      "@F1@",
      "@F2@",
    ]);
    expect(reloaded.individuals["@I4@"]?.childOfFamilyXrefs).toEqual(["@F2@"]);
  });
});
