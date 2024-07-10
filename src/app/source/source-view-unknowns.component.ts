import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source-view-unknowns',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-view-unknowns.component.html',
  styleUrl: './source.component.css',
})
export class SourceViewUnknownsComponent {
  readonly source = input.required<GedcomSource>();
}
