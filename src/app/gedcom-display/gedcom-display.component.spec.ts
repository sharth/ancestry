import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { GedcomDisplayComponent } from "./gedcom-display.component";

describe("GedcomDisplayComponent", () => {
  let component: GedcomDisplayComponent;
  let fixture: ComponentFixture<GedcomDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GedcomDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GedcomDisplayComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      "gedcomRecord",
      newGedcomRecord({
        tag: "REPO",
        xref: "@R1@",
        children: [newGedcomRecord({ tag: "NAME", value: "Test Repository" })],
      }),
    );
    fixture.detectChanges();
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
    expect(pres[0]!.getAttribute("data-level")).toBe("0"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(pres[1]!.textContent).toBe("1 NAME Test Repository"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(pres[1]!.getAttribute("data-level")).toBe("1"); // eslint-disable-line @typescript-eslint/no-non-null-assertion
  });
});
