import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-repositories",
  imports: [RouterLink],
  templateUrl: "./repositories.component.html",
  styleUrl: "./repositories.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriesComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      repositories: Object.values(ancestryDatabase.repositories),
    };
  });
}
