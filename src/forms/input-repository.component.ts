import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomRepository } from "../gedcom/gedcomRepository";
import type { OnInit } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  signal,
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-repository",
  imports: [FormField],
  templateUrl: "./input-repository.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryComponent implements OnInit {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly repository = signal<GedcomRepository>({
    xref: "",
    name: "",
  });
  readonly form = form(this.repository);

  readonly updateAngularDatabase = effect(() => {
    const repository: GedcomRepository = {
      ...this.repository(),
    };
    if (repository.xref !== "") {
      this.ancestryDatabase.update((ancestryDatabase) => ({
        ...ancestryDatabase,
        repositories: {
          ...ancestryDatabase.repositories,
          [repository.xref]: repository,
        },
      }));
    }
  });

  ngOnInit(): void {
    this.repository.set(
      this.ancestryDatabase().repositories[this.xref()] ?? {
        xref: this.xref(),
        name: "",
      },
    );
  }
}
