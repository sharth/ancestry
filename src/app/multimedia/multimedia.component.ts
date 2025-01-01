import { Component, computed, inject, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";
import { MultimediaEditorComponent } from "../multimedia-editor/multimedia-editor.component";

@Component({
  selector: "app-multimedia",
  standalone: true,
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
