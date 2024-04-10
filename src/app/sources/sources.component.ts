import { Component, inject } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { type GedcomSource } from '../../gedcom'

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.css'
})
export class SourcesComponent {
  ancestryService = inject(AncestryService)

  sources(): GedcomSource[] {
    return this.ancestryService
      .sources()
      .toSorted((lhs, rhs) => (lhs.shortTitle ?? '').localeCompare(rhs.shortTitle ?? ''))
  }
}
