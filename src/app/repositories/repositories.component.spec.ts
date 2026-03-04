import { RepositoriesComponent } from "./repositories.component";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, expect, it, beforeEach } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";

describe("RepositoriesComponent", () => {
  let component: RepositoriesComponent;
  let fixture: ComponentFixture<RepositoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoriesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoriesComponent);
    component = fixture.componentInstance;

    // Provide mock AncestryDatabase
    const mockDatabase: AncestryDatabase = {
      individuals: {},
      families: {},
      sources: {},
      repositories: {},
      multimedias: {},
      submitters: {},
    };
    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
