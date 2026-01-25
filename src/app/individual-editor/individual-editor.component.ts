import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
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
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-individual-editor",
  imports: [InputIndividualComponent, GedcomDiffComponent],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualEditorComponent {
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
