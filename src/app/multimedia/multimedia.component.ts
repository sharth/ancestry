import type { AncestryDatabase } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia",
  imports: [RouterModule, MultimediaEditorComponent],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultimediaComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const multimedia = ancestryDatabase.multimedias[this.xref()];
    if (multimedia === undefined) {
      return undefined;
    }

    return { multimedia };
  });
}
