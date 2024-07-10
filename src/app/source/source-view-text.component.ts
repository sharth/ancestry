import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-view-text',
  standalone: true,
  imports: [],
  templateUrl: './source-view-text.component.html',
  styleUrl: './source.component.css',
})
export class SourceViewTextComponent {
  readonly source = input.required<GedcomSource>();
}
