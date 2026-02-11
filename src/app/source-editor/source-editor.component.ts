import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputSourceComponent } from "../../forms/input-source.component";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor",
  templateUrl: "./source-editor.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [RouterModule, InputSourceComponent, GedcomDiffComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  readonly effectiveXref = computed<string>(
    () => this.xref() ?? this.ancestryService.nextSourceXref(),
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
    await this.router.navigate([], {
      relativeTo: this.route,
      onSameUrlNavigation: "reload",
      skipLocationChange: true,
    });
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
