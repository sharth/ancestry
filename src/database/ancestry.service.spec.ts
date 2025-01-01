/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { TestBed } from "@angular/core/testing";
import { provideExperimentalZonelessChangeDetection } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { AncestryService } from "../database/ancestry.service";
import { GedcomSource } from "../gedcom";
import * as rxjs from "rxjs";

describe("AncestryService", () => {
  let ancestryService: AncestryService;
  let ancestryDatabase: typeof ancestryService.ancestryDatabase;
  let ancestryResource: typeof ancestryService.ancestryResource;

  function waitForAncestryResource(): Promise<void> {
    return TestBed.runInInjectionContext(async () => {
      await rxjs.firstValueFrom(
        toObservable(ancestryResource.isLoading).pipe(
          rxjs.filter((value: boolean) => !value)
        )
      );
    });
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
    });

    indexedDB.deleteDatabase("AncestryDatabase");
    ancestryService = TestBed.inject(AncestryService);
    ancestryDatabase = ancestryService.ancestryDatabase;
    ancestryResource = ancestryService.ancestryResource;

    await waitForAncestryResource();
    expect(ancestryResource.hasValue()).toBeTrue();
  });

  it("AncestryResource notices database changes", async () => {
    expect(ancestryResource.hasValue()).toBeTrue();
    expect(Array.from(ancestryResource.value()!.sources.keys())).toEqual([]);
    await ancestryDatabase.sources.add(new GedcomSource("@S10@"));
    await waitForAncestryResource();
    expect(Array.from(ancestryResource.value()!.sources.keys())).toEqual([
      "@S10@",
    ]);
  });
});
