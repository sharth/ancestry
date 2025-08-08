import { Component, inject, input, linkedSignal, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { AncestryService } from "../../database/ancestry.service";
import { SourceEditorRepositoryCitationsComponent } from "./source-editor-repositories.component";
import { SourceEditorUnknownsComponent } from "./source-editor-unknowns.component";
import { SourceEditorMultimediaLinksComponent } from "./source-editor-multimedia-links.component";

@Component({
  selector: "app-source-editor",
  templateUrl: "./source-editor.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SourceEditorRepositoryCitationsComponent,
    SourceEditorUnknownsComponent,
    SourceEditorMultimediaLinksComponent,
  ],
})
export class SourceEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryDatabase = this.ancestryService.ancestryDatabase;

  readonly xref = input<string>();
  readonly finished = output();

  readonly vm = linkedSignal(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) return undefined;

    const xref = this.xref();
    if (xref == null) {
      return {
        abbr: "",
        title: "",
        text: "",
        repositoryCitations: [],
        multimediaLinks: [],
        unknownRecords: [],
      };
    }
    const source = ancestry.sources.get(xref);
    if (source == undefined) return undefined;

    return {
      abbr: source.abbr,
      title: source.title,
      text: source.text,
      repositoryCitations: source.repositoryCitations.flatMap(
        (repositoryCitation) =>
          repositoryCitation.callNumbers.map((callNumber) => ({
            repositoryXref: repositoryCitation.repositoryXref,
            callNumber,
          }))
      ),
      multimediaLinks: source.multimediaLinks,
      unknownRecords: source.unknownRecords,
    };
  });

  addRepository() {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        repositoryCitations: model.repositoryCitations.concat({
          repositoryXref: "",
          callNumber: "",
        }),
      };
    });
  }

  removeRepository(repositoryCitation: {
    repositoryXref: string;
    callNumber: string;
  }) {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        repositoryCitations: model.repositoryCitations.filter(
          (c) => c !== repositoryCitation
        ),
      };
    });
  }

  addMultimediaLink() {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        multimediaLinks: model.multimediaLinks.concat({
          multimediaXref: "",
          title: "",
        }),
      };
    });
  }

  removeMultimediaLink(multimediaLink: {
    multimediaXref: string;
    title?: string;
  }) {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        multimediaLinks: model.multimediaLinks.filter(
          (m) => m !== multimediaLink
        ),
      };
    });
  }

  removeUnknownRecord(unknownRecord: GedcomRecord) {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        unknownRecords: model.unknownRecords.filter((r) => r !== unknownRecord),
      };
    });
  }

  private async nextXref(): Promise<string> {
    const sources = await this.ancestryDatabase.sources.toArray();
    const sourceXrefs = sources.map((source) => source.xref);
    const nextXrefNumber = sourceXrefs.reduce((nextXrefNumber, xref) => {
      const group = new RegExp(/^@[a-z]*(\d+)@$/, "i").exec(xref);
      return group
        ? Math.max(Number(group[1]) + 1, nextXrefNumber)
        : nextXrefNumber;
    }, 0);
    return `@S${nextXrefNumber}@`;
  }

  async submitForm() {
    const model = this.vm();
    if (model == undefined) return;

    const repositoryCitations: {
      repositoryXref: string;
      callNumbers: string[];
    }[] = Map.groupBy(model.repositoryCitations, (cite) => cite.repositoryXref)
      .entries()
      .map(([repositoryXref, repositoryCitations]) => ({
        repositoryXref,
        callNumbers: repositoryCitations.map((cite) => cite.callNumber),
      }))
      .toArray();

    await this.ancestryDatabase.transaction("rw", ["sources"], async () => {
      const xref = this.xref() ?? (await this.nextXref());

      await this.ancestryDatabase.sources.put({
        xref: xref,
        abbr: model.abbr,
        title: model.title,
        text: model.text,
        repositoryCitations,
        unknownRecords: model.unknownRecords,
        multimediaLinks: model.multimediaLinks,
      });
    });

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
