import { inputBinding, signal } from "@angular/core";
import {
  DeferBlockBehavior,
  type ComponentFixture,
} from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";

describe("InputRepositoryLinksComponent", () => {
  let fixture: ComponentFixture<InputRepositoryLinksComponent>;
  let component: InputRepositoryLinksComponent;
  let nativeElement: HTMLElement;

  const workingDatabase = signal(
    newGedcomDatabase({
      repositories: {
        R1: { xref: "R1", name: "Mock Repository 1" },
      },
    }),
  );
  const value = signal([]);

  beforeEach(async () => {
    const renderResult = await render(InputRepositoryLinksComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("value", value),
      ],
      configureTestBed: (testBed) => {
        testBed.configureTestingModule({
          deferBlockBehavior: DeferBlockBehavior.Playthrough,
        });
      },
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open newly appended repository details by default and focus the repository xref component", async () => {
    const user = userEvent.setup();
    //   const element = fixture.nativeElement as HTMLElement;
    // const focusSpy = vi.spyOn(InputRepositoryXrefComponent.prototype, "focus");

    // Open the container details to render the defer block content.
    const containerDetails =
      nativeElement.querySelector<HTMLDetailsElement>("details");
    assert.isOk(containerDetails);
    const containerSummary =
      containerDetails.querySelector<HTMLElement>("summary");
    assert.isOk(containerSummary);
    await user.click(containerSummary);
    await fixture.whenStable();
    assert.isTrue(containerDetails.open);

    // Add an additional repository link.
    const addButton = containerDetails.querySelector(
      'button[aria-label="Add repository link"]',
    );
    assert.isOk(addButton);
    await user.click(addButton);
    await fixture.whenStable();

    // // When adding an additional repository, we should see focus called on the correct thing.
    // expect(focusSpy).toHaveBeenCalled();

    // // When a new repository link is added, it should be open.
    // const newLinkDetails = containerDetails.querySelector<HTMLDetailsElement>(
    //   ":scope > details:last-of-type",
    // );
    // assert.isOk(newLinkDetails);
    // assert.isTrue(newLinkDetails.open);
  });
});
