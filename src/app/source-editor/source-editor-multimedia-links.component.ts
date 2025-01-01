import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AncestryService } from "../../database/ancestry.service";
import { AgGridAngular } from "ag-grid-angular";
import type { GridOptions } from "ag-grid-community";

@Component({
  selector: "app-source-editor-multimedia-links",
  templateUrl: "./source-editor-multimedia-links.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [CommonModule, RouterModule, FormsModule, AgGridAngular],
})
export class SourceEditorMultimediaLinksComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly multimediaLinks =
    input.required<{ multimediaXref: string; title?: string }[]>();

  readonly addMultimediaLink = output();
  readonly removeMultimediaLink = output<{
    multimediaXref: string;
    title?: string;
  }>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) return undefined;

    return {
      multimediaLinks: this.multimediaLinks(),
      multimedia: ancestry.multimedia,
    };
  });

  readonly gridOptions: GridOptions<{
    multimediaXref: string;
    title?: string;
  }> = {
    columnDefs: [
      {
        cellRenderer: CustomButtonComponent,
        // cellRendererParams: {
        //   onClick: this.onBtnClick1.bind(this),
        //   label: "Click 1",
        // },
      },
      { field: "multimediaXref", editable: true },
      { field: "title", editable: true },
    ],
    autoSizeStrategy: {
      type: "fitCellContents",
    },
    domLayout: "autoHeight",
  };
}

class CustomButtonComponent {
  eGui!: HTMLDivElement;
  eButton?: HTMLButtonElement;
  eventListener!: () => void;

  init() {
    this.eGui = document.createElement("div");
    this.eButton = document.createElement("button");
    this.eButton.className = "btn-simple";
    this.eButton.textContent = "Launch!";
    this.eventListener = () => {
      alert("Software Launched");
    };
    this.eButton.addEventListener("click", this.eventListener);
    this.eGui.appendChild(this.eButton);
  }

  refresh() {
    return true;
  }

  destroy() {
    this.eButton?.removeEventListener("click", this.eventListener);
  }
}
