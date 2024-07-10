import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-view-title',
  standalone: true,
  imports: [],
  templateUrl: './source-view-title.component.html',
  styleUrls: ['./source.component.css'],
})
export class SourceViewTitleComponent {
  readonly source = input.required<GedcomSource>();
}
