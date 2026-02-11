import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import { InputMultimediaComponent } from "../../forms/input-multimedia.component";
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
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-gedcom-editor",
  imports: [
    InputIndividualComponent,
    InputSourceComponent,
    InputMultimediaComponent,
    GedcomDiffComponent,
  ],
  templateUrl: "./gedcom-editor.component.html",
  styleUrl: "./gedcom-editor.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GedcomEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly xref = input<string>();
  readonly type = input.required<"INDI" | "SOUR" | "OBJE">();
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

  readonly effectiveXref = computed<string>(() => {
    const xref = this.xref();
    if (xref) return xref;

    switch (this.type()) {
      case "INDI":
        return this.ancestryService.nextIndividualXref();
      case "SOUR":
        return this.ancestryService.nextSourceXref();
      case "OBJE":
        return this.ancestryService.nextMultimediaXref();
    }
  });

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
