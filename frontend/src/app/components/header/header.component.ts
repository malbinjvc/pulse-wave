import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <div class="flex items-center gap-4">
        <button
          (click)="toggleSidebar.emit()"
          class="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span class="text-lg font-bold text-white hidden sm:block">PulseWave</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative hidden md:block">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            class="bg-gray-700 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 w-64 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
          />
        </div>

        <button class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div class="relative">
          <button
            (click)="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-white">
                {{ getUserInitial() }}
              </span>
            </div>
            <svg class="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          @if (userMenuOpen) {
            <div class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50">
              <div class="p-3 border-b border-gray-700">
                <p class="text-sm text-white font-medium">{{ authService.user()?.name || 'User' }}</p>
                <p class="text-xs text-gray-400">{{ authService.user()?.email || '' }}</p>
              </div>
              <div class="p-1">
                <a routerLink="/settings" (click)="userMenuOpen = false"
                   class="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md transition-colors">
                  Settings
                </a>
                <button
                  (click)="logout()"
                  class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  toggleSidebar = output<void>();
  userMenuOpen = false;

  getUserInitial(): string {
    const name = this.authService.user()?.name;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
  }
}
