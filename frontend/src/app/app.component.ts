import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    @if (isLoginPage()) {
      <router-outlet />
    } @else {
      <div class="h-screen flex flex-col bg-gray-900">
        <app-header (toggleSidebar)="toggleSidebar()" />
        <div class="flex flex-1 overflow-hidden">
          <app-sidebar [isOpen]="sidebarOpen()" />
          <!-- Overlay for mobile -->
          @if (sidebarOpen()) {
            <div
              class="fixed inset-0 bg-black/50 z-30 lg:hidden"
              (click)="sidebarOpen.set(false)"
            ></div>
          }
          <main class="flex-1 overflow-y-auto p-4 lg:p-6">
            <router-outlet />
          </main>
        </div>
      </div>
    }
  `
})
export class AppComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  sidebarOpen = signal(false);
  isLoginPage = signal(false);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage.set(event.urlAfterRedirects === '/login');
      // Close sidebar on navigation on mobile
      this.sidebarOpen.set(false);
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}
