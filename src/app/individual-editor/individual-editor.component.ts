import { Component, inject, input, linkedSignal, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AncestryService } from "../../database/ancestry.service";
import type { GedcomEvent } from "../../gedcom/gedcomEvent";
import type { GedcomName } from "../../gedcom/gedcomName";
import { IndividualEditorNamesComponent } from "./individual-editor-names.component";
import { IndividualEditorEventsComponent } from "./individual-editor-events.component";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";

@Component({
  selector: "app-individual-editor",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IndividualEditorNamesComponent,
    IndividualEditorEventsComponent,
  ],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryDatabase = this.ancestryService.ancestryDatabase;
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly xref = input<string>();
  readonly finished = output();

  readonly vm = linkedSignal<GedcomIndividual | undefined>(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == null) return;

    const xref = this.xref();
    if (xref == null) {
      const newIndividual: GedcomIndividual = {
        xref: "",
        names: [],
        events: [],
        childOfFamilyXref: [],
        parentOfFamilyXref: [],
      };
      return newIndividual;
    }

    const individual = ancestry.individuals.get(xref);
    if (individual == null) return;

    return individual;
  });

  private async nextXref(): Promise<string> {
    const individualXrefs = await this.ancestryDatabase.individuals
      .toCollection()
      .primaryKeys();
    const nextXrefNumber = individualXrefs.reduce((nextXrefNumber, xref) => {
      const group = new RegExp(/^@[a-z]*(\d+)@$/, "i").exec(xref);
      return group
        ? Math.max(Number(group[1]) + 1, nextXrefNumber)
        : nextXrefNumber;
    }, 0);
    return `@I${nextXrefNumber}@`;
  }

  addName() {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        names: model.names.concat({
          citations: [],
        }),
      };
    });
  }

  removeName(gedcomName: GedcomName) {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        names: model.names.filter((c) => c !== gedcomName),
      };
    });
  }

  addEvent() {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        events: model.events.concat({
          tag: "",
          sharedWith: [],
          citations: [],
        }),
      };
    });
  }

  removeEvent(event: GedcomEvent) {
    this.vm.update((model) => {
      if (model == null) return undefined;
      return {
        ...model,
        events: model.events.filter((c) => c !== event),
      };
    });
  }

  async submitForm() {
    const vm = this.vm();
    if (vm == null) return;

    await this.ancestryDatabase.transaction(
      "rw",
      [this.ancestryDatabase.individuals],
      async () => {
        const xref = this.xref() ?? (await this.nextXref());
        await this.ancestryDatabase.individuals.put({ ...vm, xref });
      }
    );

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
