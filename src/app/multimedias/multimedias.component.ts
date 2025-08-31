import { AncestryService } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";
import { Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-multimedias",
  imports: [RouterLink, MultimediaEditorComponent],
  templateUrl: "./multimedias.component.html",
  styleUrl: "./multimedias.component.css",
})
export class MultimediasComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      multimedias: ancestry.multimedias.values().toArray(),
    };
  });
}
