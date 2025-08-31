import { AncestryService } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia",
  imports: [RouterModule, MultimediaEditorComponent],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
})
export class MultimediaComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry === undefined) {
      return undefined;
    }

    const multimedia = ancestry.multimedias.get(this.xref());
    if (multimedia == undefined) {
      return undefined;
    }

    return {
      multimedia,
    };
  });
}
