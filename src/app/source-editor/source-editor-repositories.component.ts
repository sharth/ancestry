import { AncestryService } from "../../database/ancestry.service";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor-repositories",
  templateUrl: "./source-editor-repositories.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SourceEditorRepositoryCitationsComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly repositoryCitations =
    input.required<{ repositoryXref: string; callNumber: string }[]>();

  readonly addRepository = output();
  readonly removeRepository = output<{
    repositoryXref: string;
    callNumber: string;
  }>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) return undefined;

    return {
      repositoryCitations: this.repositoryCitations(),
      repositories: ancestry.repositories,
    };
  });
}
