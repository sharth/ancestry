import { AncestryService } from "../../database/ancestry.service";
import { Component, computed, inject } from "@angular/core";

@Component({
  selector: "app-index",
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
})
export class IndexComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) return undefined;

    return {
      individuals: ancestry.individuals.values().toArray(),
      families: ancestry.families.values().toArray(),
      sources: ancestry.sources.values().toArray(),
      repositories: ancestry.repositories.values().toArray(),
      submitters: ancestry.submitters.values().toArray(),
    };
  });
}
