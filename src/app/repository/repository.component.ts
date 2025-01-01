import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";
import { RepositorySourcesComponent } from "./repository-sources.component";
import {
  serializeGedcomRecordToText,
  serializeGedcomRepository,
} from "../../gedcom";

@Component({
  selector: "app-repository",
  standalone: true,
  imports: [CommonModule, RouterModule, RepositorySourcesComponent],
  templateUrl: "./repository.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositoryComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
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
        serializeGedcomRepository(repository)
      ).join("\n"),
    };
  });
}
