// import { AncestryService } from "../../database/ancestry.service";
// import { SourceEditorComponent } from "./source-editor.component";
// import { provideZonelessChangeDetection } from "@angular/core";
// import { toObservable } from "@angular/core/rxjs-interop";
// import type { ComponentFixture } from "@angular/core/testing";
// import { TestBed } from "@angular/core/testing";
// import * as rxjs from "rxjs";

// describe("SourceEditorComponent", () => {
//   let ancestryService: AncestryService;
//   let ancestryResource: typeof ancestryService.ancestryResource;
//   let ancestryDatabase: typeof ancestryService.ancestryDatabase;
//   let fixture: ComponentFixture<SourceEditorComponent>;
//   let component: SourceEditorComponent;

//   function waitForAncestryResource(): Promise<void> {
//     return TestBed.runInInjectionContext(async () => {
//       await rxjs.firstValueFrom(
//         toObservable(ancestryResource.isLoading).pipe(
//           rxjs.filter((value: boolean) => !value),
//         ),
//       );
//     });
//   }

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [provideZonelessChangeDetection()],
//       imports: [SourceEditorComponent],
//     });
//   });

//   beforeEach(async () => {
//     ancestryService = TestBed.inject(AncestryService);
//     ancestryDatabase = ancestryService.ancestryDatabase;
//     ancestryResource = ancestryService.ancestryResource;

//     await ancestryDatabase.repositories.clear();
//     await ancestryDatabase.repositories.add({
//       xref: "@R1@",
//       name: "Repository 1",
//     });
//     await ancestryDatabase.repositories.add({
//       xref: "@R2@",
//       name: "Repository 2",
//     });

//     await ancestryDatabase.sources.clear();
//     await ancestryDatabase.sources.add({
//       xref: "@S1@",
//       abbr: "Source 1",
//       title: "Title 1",
//       repositoryLinks: [],
//       unknownRecords: [],
//       multimediaLinks: [],
//     });

//     await waitForAncestryResource();
//     expect(ancestryResource.hasValue()).toEqual(true);
//     expect(ancestryResource.value()?.sources.keys()).toContain("@S1@");
//   });

//   beforeEach(async () => {
//     fixture = TestBed.createComponent(SourceEditorComponent);
//     fixture.componentRef.setInput("xref", "@S1@");
//     await fixture.whenStable();
//     component = fixture.componentInstance;
//   });

//   it("form model is correct", () => {
//     expect(component.xref()).toEqual("@S1@");
//     expect(component.vm()).toEqual({
//       abbr: "Source 1",
//       title: "Title 1",
//       text: undefined,
//       repositoryLinks: [],
//       unknownRecords: [],
//       multimediaLinks: [],
//     });

//     const nativeElement = fixture.nativeElement as HTMLElement | undefined;
//     expect(nativeElement).toBeDefined();

//     const abbrElement = nativeElement?.querySelector<HTMLTextAreaElement>(
//       "textarea[name='abbr']",
//     );
//     expect(abbrElement).toBeDefined();
//     expect(abbrElement?.value).toEqual("Source 1");

//     const titleElement = nativeElement?.querySelector<HTMLTextAreaElement>(
//       "textarea[name='title']",
//     );
//     expect(titleElement).toBeDefined();
//     expect(titleElement?.value).toEqual("Title 1");
//   });

//   it("add repositories", async () => {
//     expect(component.xref()).toEqual("@S1@");
//     expect(component.vm()?.repositoryLinks).toEqual([]);
//     component.addRepository();
//     await waitForAncestryResource();
//     expect(component.vm()?.repositoryLinks).toEqual([
//       { repositoryXref: "", callNumber: "" },
//     ]);

//     const nativeElement = fixture.nativeElement as HTMLElement | undefined;
//     expect(nativeElement).toBeDefined();
//   });
// });
