import { AncestryService } from "../../database/ancestry.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-repositories",
  templateUrl: "./source-repositories.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceRepositoriesComponent {
  readonly xref = input.required<string>();

  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      citations: source.repositoryLinks.map((repositoryLink) => ({
        repositoryXref: repositoryLink.repositoryXref,
        callNumber: repositoryLink.callNumber,
        repository: ancestry.repositories[repositoryLink.repositoryXref],
      })),
    };
  });
}
