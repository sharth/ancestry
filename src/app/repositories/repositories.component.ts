import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-repositories",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./repositories.component.html",
  styleUrl: "./repositories.component.css",
})
export class RepositoriesComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      repositories: ancestry.repositories.values().toArray(),
    };
  });
}
