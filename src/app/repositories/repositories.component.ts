import {Component, computed, inject} from '@angular/core';
import {AncestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css',
})
export class RepositoriesComponent {
  ancestryService = inject(AncestryService);
  repositories = computed(() => this.ancestryService.repositories().toList());
}
