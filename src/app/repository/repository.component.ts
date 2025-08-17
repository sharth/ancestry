import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { RepositorySourcesComponent } from "./repository-sources.component";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-repository",
  imports: [RouterModule, RepositorySourcesComponent],
  templateUrl: "./repository.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositoryComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }
    const repository = ancestry.repositories.get(this.xref());
    if (repository == undefined) {
      return undefined;
    }

    return {
      name: repository.name,
      gedcom: serializeGedcomRecordToText(
        serializeGedcomRepository(repository),
      ).join("\n"),
    };
  });
}
