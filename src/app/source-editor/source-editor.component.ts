import { AncestryService } from "../../database/ancestry.service";
import { InputSourceComponent } from "../../forms/input-source.component";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { Component, inject, input, output } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NonNullableFormBuilder, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor",
  templateUrl: "./source-editor.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [RouterModule, ReactiveFormsModule, InputSourceComponent],
})
export class SourceEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly xref = input<string>();
  readonly finished = output();

  readonly form = this.formBuilder.control<GedcomSource | undefined>(undefined);
  readonly formSignal = toSignal(this.form.valueChanges);

  ngOnInit() {
    const ancestry = this.ancestryService.contents();
    const source = ancestry?.sources.get(this.xref() ?? "");
    this.form.setValue(source);
  }

  async submitForm() {
    // await this.ancestryDatabase.transaction("rw", ["sources"], async () => {
    //   const xref = this.xref() ?? (await this.nextXref());

    //   await this.ancestryDatabase.sources.put({
    //     xref: xref,
    //     abbr: model.abbr,
    //     title: model.title,
    //     text: model.text,
    //     repositoryCitations,
    //     unknownRecords: model.unknownRecords,
    //     multimediaLinks: model.multimediaLinks,
    //   });
    // });

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
