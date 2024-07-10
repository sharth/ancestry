import {Component, input} from '@angular/core';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-source-view-citations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './source-view-citations.component.html',
  styleUrl: './source.component.css',
})
export class SourceViewCitationsComponent {
  readonly source = input.required<GedcomSource>();
}
