import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { RepositoriesComponent } from "./repositories.component";

describe("RepositoriesComponent", () => {
  let component: RepositoriesComponent;
  let fixture: ComponentFixture<RepositoriesComponent>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(RepositoriesComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("ancestryDatabase", newGedcomDatabase());
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
