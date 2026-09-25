import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { GedcomDisplayComponent } from "./gedcom-display.component";

describe("GedcomDisplayComponent", () => {
  let component: GedcomDisplayComponent;
  let fixture: ComponentFixture<GedcomDisplayComponent>;

  beforeEach(async () => {
    const gedcomRecord = signal(
      newGedcomRecord({
        tag: "REPO",
        xref: "@R1@",
        children: [newGedcomRecord({ tag: "NAME", value: "Test Repository" })],
      }),
    );

    const renderResult = await render(GedcomDisplayComponent, {
      bindings: [inputBinding("gedcomRecord", gedcomRecord)],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render lines inside a scrolling container", () => {
    const element = fixture.nativeElement as HTMLElement;
    const container = element.querySelector(".gedcom-display");
    expect(container).toBeTruthy();

    const pres = element.querySelectorAll("pre");
    expect(pres.length).toBe(2);
    expect(pres[0]!.textContent).toBe("0 @R1@ REPO"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(pres[0]!.getAttribute("data-indent")).toBe("0"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(pres[1]!.textContent).toBe("1 NAME Test Repository"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(pres[1]!.getAttribute("data-indent")).toBe("1"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
  });
});
