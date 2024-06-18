import {CommonModule} from '@angular/common';
import {Component, computed, inject, input} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AncestryService} from '../ancestry.service';

@Component({
  selector: 'app-source-editor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './source-editor.component.html',
  styleUrl: './source-editor.component.css',
})
export class SourceEditorComponent {
  ancestryService = inject(AncestryService);
  xref = input.required<string>();
  source = computed(() => this.ancestryService.source(this.xref()));

  repositories = computed(() => {
    return [...this.ancestryService.repositories().values()];
  });
}
