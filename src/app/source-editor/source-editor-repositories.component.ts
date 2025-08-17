import { AncestryService } from "../../database/ancestry.service";
import { InputRepositoryCallNumberComponent } from "../../forms/input-repository-call-number.component";
import { InputRepositoryXrefComponent } from "../../forms/input-repository-xref.component";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor-repositories",
  templateUrl: "./source-editor-repositories.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [
    RouterModule,
    FormsModule,
    InputRepositoryCallNumberComponent,
    InputRepositoryXrefComponent,
  ],
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
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) return undefined;

    return {
      repositoryCitations: this.repositoryCitations(),
      repositories: ancestry.repositories,
    };
  });
}
