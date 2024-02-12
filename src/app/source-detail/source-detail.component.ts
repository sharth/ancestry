import { Component, computed, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-source-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './source-detail.component.html',
  styleUrl: './source-detail.component.css'
})
export class SourceDetailComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
  source = computed(() => this.ancestryService.source(this.xref()))
}
