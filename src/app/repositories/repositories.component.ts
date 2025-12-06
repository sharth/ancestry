import { AncestryService } from "../../database/ancestry.service";
import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-repositories",
  imports: [RouterLink],
  templateUrl: "./repositories.component.html",
  styleUrl: "./repositories.component.css",
})
export class RepositoriesComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      repositories: Object.values(ancestry.repositories),
    };
  });
}
