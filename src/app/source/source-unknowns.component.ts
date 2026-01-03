import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-unknowns",
  templateUrl: "./source-unknowns.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceUnknownsComponent {
  readonly xref = input.required<string>();

  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }
    const source = ancestry.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      unknownGedcom: source.unknownRecords.map((unknownRecord) =>
        serializeGedcomRecordToText(unknownRecord),
      ),
    };
  });
}
