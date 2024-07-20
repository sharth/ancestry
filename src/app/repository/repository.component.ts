import {Component, computed, input} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-repository',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './repository.component.html',
  styleUrl: './repository.component.css',
})
export class RepositoryComponent {
  readonly ancestryService = ancestryService;
  xref = input.required<string>();
  repository = computed(() => this.ancestryService.repository(this.xref()));
}
