import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { FamilyComponent } from "./family.component";

describe("FamilyComponent", () => {
  let component: FamilyComponent;
  let fixture: ComponentFixture<FamilyComponent>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FamilyComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      "ancestryDatabase",
      newGedcomDatabase({
        families: {
          "@F1@": newGedcomFamily({ xref: "@F1@" }),
        },
      }),
    );
    fixture.componentRef.setInput("xref", "@F1@");
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
