import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-source-view-repositories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-view-repositories.component.html',
  styleUrl: './source.component.css',
})
export class SourceViewRepositoriesComponent {
  readonly source = input.required<GedcomSource>();
}
