import { Component, inject, input, linkedSignal, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-multimedia-editor",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./multimedia-editor.component.html",
  styleUrl: "./multimedia-editor.component.css",
})
export class MultimediaEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryDatabase = this.ancestryService.ancestryDatabase;
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly xref = input<string>();
  readonly finished = output();

  readonly vm = linkedSignal(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == null) return;

    const xref = this.xref();
    if (xref == null) {
      return {
        filePath: "",
        mimeType: "",
      };
    }

    const multimedia = ancestry.multimedia.get(xref);
    if (multimedia == null) return;

    return {
      filePath: multimedia.filePath,
      mimeType: multimedia.mediaType,
    };
  });

  private async nextXref(): Promise<string> {
    const multimedias = await this.ancestryDatabase.multimedia.toArray();
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

    await this.ancestryDatabase.transaction(
      "rw",
      [this.ancestryDatabase.multimedia],
      async () => {
        const xref = this.xref() ?? (await this.nextXref());

        await this.ancestryDatabase.multimedia.put({
          xref,
          filePath: vm.filePath,
          mediaType: vm.mimeType,
        });
      }
    );

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
