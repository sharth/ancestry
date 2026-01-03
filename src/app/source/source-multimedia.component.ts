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
  selector: "app-source-multimedia",
  templateUrl: "./source-multimedia.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceMultimediaComponent {
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
      multimediaLinks: source.multimediaLinks.map((multimediaLink) => ({
        ...ancestry.multimedias[multimediaLink.xref],
        xref: this.xref(),
        title: multimediaLink.title,
      })),
    };
  });
}
