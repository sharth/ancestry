import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";

import { ErrorBannerComponent } from "./error-banner/error-banner.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, ErrorBannerComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  search(query: string) {
    this.closeSidebar();
    void this.router.navigate(["/search"], { queryParams: { q: query } });
  }
}
