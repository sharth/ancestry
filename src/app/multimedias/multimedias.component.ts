import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";

@Component({
  selector: "app-multimedias",
  standalone: true,
  imports: [CommonModule, RouterLink, MultimediaEditorComponent],
  templateUrl: "./multimedias.component.html",
  styleUrl: "./multimedias.component.css",
})
export class MultimediasComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      multimedias: ancestry.multimedia.values().toArray(),
    };
  });
}
