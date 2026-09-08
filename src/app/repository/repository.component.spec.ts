import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { RepositoryComponent } from "./repository.component";

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
    const mockDatabase = newGedcomDatabase({
      repositories: {
        "@R1@": newGedcomRepository({
          xref: "@R1@",
          name: "Test Repository",
        }),
      },
    });
    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("xref", "@R1@");

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
