import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { RepositoriesComponent } from "./repositories.component";

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
