import { AncestryService } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";
import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia",
  imports: [CommonModule, RouterModule, MultimediaEditorComponent],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
})
export class MultimediaComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryResource = this.ancestryService.ancestryResource;

  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryResource.value();
    if (ancestry === undefined) {
      return undefined;
    }

    const multimedia = ancestry.multimedia.get(this.xref());
    if (multimedia == undefined) {
      return undefined;
    }

    return {
      multimedia,
    };
  });
}
