/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AncestryService } from "../database/ancestry.service";
import { provideZonelessChangeDetection } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { TestBed } from "@angular/core/testing";
import * as rxjs from "rxjs";

describe("AncestryService", () => {
  let ancestryService: AncestryService;
  let ancestryDatabase: typeof ancestryService.ancestryDatabase;
  let ancestryResource: typeof ancestryService.ancestryResource;

  function waitForAncestryResource(): Promise<void> {
    return TestBed.runInInjectionContext(async () => {
      await rxjs.firstValueFrom(
        toObservable(ancestryResource.isLoading).pipe(
          rxjs.filter((value: boolean) => !value),
        ),
      );
    });
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
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
    expect(ancestryResource.value()!.sources.keys().toArray()).toEqual([]);
    await ancestryDatabase.sources.add({
      xref: "@S10@",
      repositoryCitations: [],
      unknownRecords: [],
      multimediaLinks: [],
    });
    await waitForAncestryResource();
    expect(ancestryResource.value()!.sources.keys().toArray()).toEqual([
      "@S10@",
    ]);
  });
});
