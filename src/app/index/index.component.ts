import { Component, computed, inject } from "@angular/core";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-index",
  standalone: true,
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
})
export class IndexComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == undefined) return undefined;

    return {
      individuals: Array.from(ancestry.individuals.values()),
      families: Array.from(ancestry.families.values()),
      sources: Array.from(ancestry.sources.values()),
      repositories: Array.from(ancestry.repositories.values()),
      submitters: Array.from(ancestry.submitters.values()),
    };
  });
}
