import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputSourceComponent } from "../../forms/input-source.component";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor",
  templateUrl: "./source-editor.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [RouterModule, InputSourceComponent, GedcomDiffComponent],
})
export class SourceEditorComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input<string>();
  readonly finished = output();

  readonly computedDatabase = signal<AncestryDatabase>(
    this.ancestryService.ancestryDatabase() ?? {
      individuals: {},
      families: {},
      sources: {},
      multimedias: {},
      submitters: {},
      repositories: {},
    },
  );

  readonly differences = computed(() =>
    this.ancestryService
      .compareGedcomDatabase(this.computedDatabase())
      .filter(
        ({ canonicalRecord, currentRecord }) =>
          canonicalRecord == undefined ||
          currentRecord == undefined ||
          serializeGedcomRecordToText(canonicalRecord).join("\n") !==
            serializeGedcomRecordToText(currentRecord).join("\n"),
      ),
  );

  async submitForm() {
    const computedDatabase = this.computedDatabase();
    await this.ancestryService.updateGedcomDatabase(computedDatabase);
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
