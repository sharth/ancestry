import { Component, inject, input, linkedSignal, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AncestryService } from "../../database/ancestry.service";
import { GedcomIndividual } from "../../gedcom";

@Component({
  selector: "app-individual-editor",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryDatabase = this.ancestryService.ancestryDatabase;
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly xref = input<string>();
  readonly finished = output();

  readonly vm = linkedSignal<{ name: string; surname: string } | undefined>(
    () => {
      const ancestry = this.ancestryResource.value();
      if (ancestry == null) return;

      const xref = this.xref();
      if (xref == null) {
        return {
          name: "",
          surname: "",
        };
      }

      const individual = ancestry.individuals.get(xref);
      if (individual == null) return;

      return {
        name: individual.name ?? "",
        surname: individual.surname ?? "",
      };
    }
  );

  private async nextXref(): Promise<string> {
    const individuals = await this.ancestryDatabase.individuals.toArray();
    const individualXrefs = individuals.map((individual) => individual.xref);
    const nextXrefNumber = individualXrefs.reduce((nextXrefNumber, xref) => {
      const group = new RegExp(/^@[a-z]*(\d+)@$/, "i").exec(xref);
      return group
        ? Math.max(Number(group[1]) + 1, nextXrefNumber)
        : nextXrefNumber;
    }, 0);
    return `@I${nextXrefNumber}@`;
  }

  async submitForm() {
    const vm = this.vm();
    if (vm == null) return;

    await this.ancestryDatabase.transaction(
      "rw",
      [this.ancestryDatabase.multimedia],
      async () => {
        const xref = this.xref() ?? (await this.nextXref());

        const gedcomIndividual = new GedcomIndividual(xref);
        gedcomIndividual.name = vm.name;
        gedcomIndividual.surname = vm.surname;
        await this.ancestryDatabase.individuals.put(gedcomIndividual);
      }
    );

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
