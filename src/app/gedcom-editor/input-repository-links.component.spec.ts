import {
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";

describe("InputRepositoryLinksComponent", () => {
  let fixture: ComponentFixture<InputRepositoryLinksComponent>;
  let component: InputRepositoryLinksComponent;

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
      imports: [InputRepositoryLinksComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InputRepositoryLinksComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workingDatabase", mockDatabase);
    fixture.componentRef.setInput("value", []);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open newly appended repository details by default and focus the repository xref component", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const focusSpy = vi.spyOn(InputRepositoryXrefComponent.prototype, "focus");

    // Open the container details to render the defer block content.
    const containerDetails =
      element.querySelector<HTMLDetailsElement>("details");
    assert.isOk(containerDetails);

    // Resolve the defer block
    const deferBlocks = await fixture.getDeferBlocks();
    assert.isAtLeast(deferBlocks.length, 1);
    await deferBlocks[0]!.render(DeferBlockState.Complete);
    fixture.detectChanges();

    // Now details lookalike button should be rendered. Let's find it.
    const addButton = containerDetails.querySelector(
      'button[aria-label="Add repository link"]',
    );
    assert.isOk(addButton);

    await user.click(addButton);
    await fixture.whenStable();

    const newLinkDetails = containerDetails.querySelector<HTMLDetailsElement>(
      ":scope > details:last-of-type",
    );
    assert.isOk(newLinkDetails);
    expect(newLinkDetails.open).toBe(true);
    expect(focusSpy).toHaveBeenCalled();
  });
});
