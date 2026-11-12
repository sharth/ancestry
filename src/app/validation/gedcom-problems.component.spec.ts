import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import type { GedcomProblem } from "../../util/record-unparsed-records";
import { GedcomProblemsComponent } from "./gedcom-problems.component";

describe("GedcomProblemsComponent", () => {
  async function renderProblems(problems: GedcomProblem[]) {
    await render(GedcomProblemsComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("problems", signal(problems))],
      waitForStableOnRender: true,
    });
  }

  it("says so when there are no problems", async () => {
    await renderProblems([]);
    expect(screen.getByText(/found no problems/)).toBeTruthy();
  });

  it("groups problems by path, with the first one's line and record", async () => {
    const problem: GedcomProblem = {
      severity: "warning",
      message: "Tag not understood by this app",
      path: "INDI.BIRT._FOO",
      xref: "@I1@",
      line: 3,
    };
    await renderProblems([
      problem,
      { ...problem, xref: "@I2@", line: 9 },
      { ...problem, path: "_BAR", xref: "", line: 12 },
    ]);
    const rows = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        Array.from(row.querySelectorAll("td"), (cell) =>
          cell.textContent.trim(),
        ),
      );
    expect(rows).toEqual([
      [
        "INDI.BIRT._FOO",
        "Warning",
        "Tag not understood by this app",
        "2",
        "3",
        "@I1@",
      ],
      ["_BAR", "Warning", "Tag not understood by this app", "1", "12", ""],
    ]);
  });

  it("links the record to its page when it has one", async () => {
    await renderProblems([
      {
        severity: "warning",
        message: "m",
        path: "FAM.MARR._FOO",
        xref: "@F1@",
      },
      { severity: "warning", message: "m", path: "_BAR.X", xref: "@X1@" },
    ]);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/family/@F1@",
    ]);
  });
});
