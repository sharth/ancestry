import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

@Component({
  selector: "app-index",
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();

    return {
      individuals: Object.values(ancestryDatabase.individuals),
      families: Object.values(ancestryDatabase.families),
      sources: Object.values(ancestryDatabase.sources),
      repositories: Object.values(ancestryDatabase.repositories),
      submitters: Object.values(ancestryDatabase.submitters),
    };
  });
}
