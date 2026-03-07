import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-white">PulseWave</h1>
          <p class="text-gray-400 mt-2">Real-time Event Analytics Platform</p>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <h2 class="text-xl font-semibold text-white mb-6">
            {{ isRegister() ? 'Create an account' : 'Sign in to your account' }}
          </h2>

          @if (error()) {
            <div class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            @if (isRegister()) {
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  [(ngModel)]="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
                />
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="you@example.com"
                required
                class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter your password"
                required
                class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              @if (loading()) {
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              {{ isRegister() ? 'Create account' : 'Sign in' }}
            </button>
          </form>

          <div class="mt-6 text-center">
            <button
              (click)="toggleMode()"
              class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {{ isRegister() ? 'Already have an account? Sign in' : "Don't have an account? Register" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  name = '';

  isRegister = signal(false);
  loading = signal(false);
  error = signal('');

  toggleMode(): void {
    this.isRegister.update(v => !v);
    this.error.set('');
  }

  onSubmit(): void {
    this.error.set('');
    this.loading.set(true);

    if (this.isRegister()) {
      this.authService.register({ name: this.name, email: this.email, password: this.password }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Registration failed. Please try again.');
        }
      });
    } else {
      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Invalid email or password.');
        }
      });
    }
  }
}
