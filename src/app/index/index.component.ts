import { AncestryService } from "../../database/ancestry.service";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";

@Component({
  selector: "app-index",
  imports: [],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndexComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) return undefined;

    return {
      individuals: Object.values(ancestry.individuals),
      families: Object.values(ancestry.families),
      sources: Object.values(ancestry.sources),
      repositories: Object.values(ancestry.repositories),
      submitters: Object.values(ancestry.submitters),
    };
  });
}
