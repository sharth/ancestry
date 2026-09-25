import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { FamiliesComponent } from "./families.component";

describe("FamiliesComponent", () => {
  let component: FamiliesComponent;
  let fixture: ComponentFixture<FamiliesComponent>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FamiliesComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("ancestryDatabase", newGedcomDatabase());
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
