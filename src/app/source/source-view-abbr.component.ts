import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';

@Component({
  selector: 'app-source-view-abbr',
  standalone: true,
  imports: [],
  templateUrl: './source-view-abbr.component.html',
  styleUrls: ['./source.component.css'],
})
export class SourceViewAbbrComponent {
  readonly source = input.required<GedcomSource>();
}
