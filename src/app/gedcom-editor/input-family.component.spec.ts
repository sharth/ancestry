import { Component, signal } from "@angular/core";
import { form } from "@angular/forms/signals";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { InputFamilyComponent } from "./input-family.component";

@Component({
  imports: [InputFamilyComponent],
  template: `<app-input-family [databaseForm]="form" xref="@F1@" />`,
})
class HostComponent {
  readonly workingDatabase = signal(
    newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          childOfFamilyXrefs: ["@F1@"],
        }),
      },
      families: {
        "@F1@": newGedcomFamily({ xref: "@F1@", childXrefs: ["@I1@"] }),
      },
    }),
  );
  readonly form = form(this.workingDatabase);
}

describe("InputFamilyComponent", () => {
  it("removes a child's FAMC along with the child, and marks the form dirty", async () => {
    const { fixture } = await render(HostComponent, {
      waitForStableOnRender: true,
    });
    const host = fixture.componentInstance;
    expect(host.form().dirty()).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Remove child" }));

    expect(host.workingDatabase().families["@F1@"]?.childXrefs).toEqual([]);
    expect(
      host.workingDatabase().individuals["@I1@"]?.childOfFamilyXrefs,
    ).toEqual([]);
    expect(host.form().dirty()).toBe(true);
  });
});
