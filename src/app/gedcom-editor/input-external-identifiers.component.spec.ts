import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomExternalIdentifier } from "../../gedcom/gedcomExternalIdentifier";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import {
  ancestryPersonIdType,
  familySearchPersonIdType,
} from "../../util/external-identifier-link";
import { InputExternalIdentifiersComponent } from "./input-external-identifiers.component";

describe("InputExternalIdentifiersComponent", () => {
  let fixture: ComponentFixture<InputExternalIdentifiersComponent>;
  let component: InputExternalIdentifiersComponent;

  beforeEach(async () => {
    const workingDatabase = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          externalIdentifiers: [
            newGedcomExternalIdentifier({
              id: "142686057968",
              type: ancestryPersonIdType("187758204"),
            }),
          ],
        }),
      },
    });
    const renderResult = await render(InputExternalIdentifiersComponent, {
      bindings: [inputBinding("workingDatabase", signal(workingDatabase))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("offers FamilySearch and the database's own types", () => {
    expect(component.knownTypes()).toEqual([
      familySearchPersonIdType,
      ancestryPersonIdType("187758204"),
    ]);
  });

  it("appends and removes identifiers", () => {
    component.appendFamilySearchPersonId();
    expect(component.value()).toEqual([
      newGedcomExternalIdentifier({ type: familySearchPersonIdType }),
    ]);

    component.appendExternalIdentifier();
    expect(component.value()).toHaveLength(2);

    component.removeExternalIdentifier(0);
    expect(component.value()).toEqual([newGedcomExternalIdentifier()]);
  });

  it("links a filled-in FamilySearch id", async () => {
    component.value.set([
      newGedcomExternalIdentifier({
        id: "KWCB-QS1",
        type: familySearchPersonIdType,
      }),
    ]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector("a");
    expect(link?.href).toBe(
      "https://www.familysearch.org/tree/person/details/KWCB-QS1",
    );
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer nofollow");
  });
});
