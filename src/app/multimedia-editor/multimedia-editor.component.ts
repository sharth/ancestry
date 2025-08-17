import { AncestryService } from "../../database/ancestry.service";
import type { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { Component, inject, input, linkedSignal, output } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-multimedia-editor",
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: "./multimedia-editor.component.html",
  styleUrl: "./multimedia-editor.component.css",
})
export class MultimediaEditorComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input<string>();
  readonly finished = output();

  readonly vm = linkedSignal(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == null) return;

    const xref = this.xref();
    if (xref == null) {
      return {
        filePath: "",
        mimeType: "",
      };
    }

    const multimedia = ancestry.multimedias.get(xref);
    if (multimedia == null) return;

    return {
      filePath: multimedia.filePath,
      mimeType: multimedia.mediaType,
      nextXref: this.nextXref(ancestry.multimedias.values().toArray()),
    };
  });

  private nextXref(multimedias: GedcomMultimedia[]): string {
    const multimediaXrefs = multimedias.map((multimedia) => multimedia.xref);
    const nextXrefNumber = multimediaXrefs.reduce((nextXrefNumber, xref) => {
      const group = new RegExp(/^@[a-z]*(\d+)@$/, "i").exec(xref);
      return group
        ? Math.max(Number(group[1]) + 1, nextXrefNumber)
        : nextXrefNumber;
    }, 0);
    return `@M${nextXrefNumber}@`;
  }

  async submitForm() {
    const vm = this.vm();
    if (vm == null) return;

    // await this.ancestryDatabase.transaction(
    //   "rw",
    //   [this.ancestryDatabase.multimedia],
    //   async () => {
    //     const xref = this.xref() ?? (await this.nextXref());

    //     await this.ancestryDatabase.multimedia.put({
    //       xref,
    //       filePath: vm.filePath,
    //       mediaType: vm.mimeType,
    //     });
    //   }
    // );

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
