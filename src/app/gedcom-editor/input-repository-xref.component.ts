import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  input,
  model,
  type ElementRef,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";

@Component({
  selector: "app-input-repository-xref",
  imports: [FormField],
  templateUrl: "./input-repository-xref.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryXrefComponent implements FormValueControl<string> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);

  readonly repositories = computed(() =>
    Object.values(this.ancestryDatabase().repositories),
  );

  @ViewChild("selectElement")
  private selectElement!: ElementRef<HTMLSelectElement>;

  focus() {
    this.selectElement.nativeElement.focus();
  }
}
