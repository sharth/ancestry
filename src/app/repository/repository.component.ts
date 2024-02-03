import { Component, computed, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './repository.component.html',
  styleUrl: './repository.component.css'
})
export class RepositoryComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
  repository = computed(() => this.ancestryService.repository(this.xref()))
}
