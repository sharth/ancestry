import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";

describe("InputRepositoryXrefComponent", () => {
  let fixture: ComponentFixture<InputRepositoryXrefComponent>;
  let component: InputRepositoryXrefComponent;

  const mockDatabase: AncestryDatabase = {
    individuals: {},
    families: {},
    sources: {},
    multimedias: {},
    submitters: {},
    repositories: {
      R1: { xref: "R1", name: "Mock Repository 1" },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputRepositoryXrefComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputRepositoryXrefComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("value", "R1");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should focus the select element when focus() is called", () => {
    const element = fixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>("select#xref");
    assert.isOk(select);

    component.focus();

    expect(document.activeElement).toBe(select);
  });
});
