import { RepositoryComponent } from "./repository.component";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, expect, it, beforeEach } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";

describe("RepositoryComponent", () => {
  let component: RepositoryComponent;
  let fixture: ComponentFixture<RepositoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepositoryComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoryComponent);
    component = fixture.componentInstance;

    // Provide mock AncestryDatabase
    const mockDatabase: AncestryDatabase = {
      individuals: {},
      families: {},
      sources: {},
      repositories: {
        "@R1@": {
          xref: "@R1@",
          name: "Test Repository",
        },
      },
      multimedias: {},
      submitters: {},
    };
    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("xref", "@R1@");

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
