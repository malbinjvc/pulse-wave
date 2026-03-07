import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-2xl">
      <div>
        <h1 class="text-2xl font-bold text-white">Settings</h1>
        <p class="text-gray-400 mt-1">Manage your profile and preferences</p>
      </div>

      <!-- Profile Section -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Profile</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {{ getUserInitial() }}
              </span>
            </div>
            <div>
              <h4 class="text-lg font-medium text-white">{{ profile.name }}</h4>
              <p class="text-sm text-gray-400">{{ profile.email }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
            <input
              type="text"
              [(ngModel)]="profile.name"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="profile.email"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="saveProfile()"
              class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Password Section -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Change Password</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              [(ngModel)]="passwords.current"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              [(ngModel)]="passwords.newPass"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              [(ngModel)]="passwords.confirm"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div class="flex justify-end pt-2">
            <button
              (click)="changePassword()"
              class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications Section -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Notifications</h3>
        </div>
        <div class="p-6 space-y-4">
          @for (notif of notifications; track notif.key) {
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-white">{{ notif.label }}</h4>
                <p class="text-xs text-gray-400">{{ notif.description }}</p>
              </div>
              <button
                (click)="notif.enabled = !notif.enabled"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                [class.bg-indigo-600]="notif.enabled"
                [class.bg-gray-600]="!notif.enabled"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  [class.translate-x-6]="notif.enabled"
                  [class.translate-x-1]="!notif.enabled"
                ></span>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-gray-800 rounded-xl border border-red-900/50">
        <div class="px-6 py-4 border-b border-red-900/50">
          <h3 class="text-lg font-semibold text-red-400">Danger Zone</h3>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-medium text-white">Delete Account</h4>
              <p class="text-xs text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button
              class="px-4 py-2 text-sm font-medium text-red-400 bg-red-900/30 rounded-lg hover:bg-red-900/50 transition-colors border border-red-900/50"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  private authService = inject(AuthService);

  savedMessage = signal('');

  profile = {
    name: this.authService.user()?.name || 'John Doe',
    email: this.authService.user()?.email || 'john@example.com'
  };

  passwords = {
    current: '',
    newPass: '',
    confirm: ''
  };

  notifications = [
    { key: 'email_alerts', label: 'Email Alerts', description: 'Receive alert notifications via email', enabled: true },
    { key: 'weekly_digest', label: 'Weekly Digest', description: 'Get a weekly summary of your events', enabled: true },
    { key: 'slack_notifications', label: 'Slack Notifications', description: 'Push notifications to Slack', enabled: false },
    { key: 'browser_notifications', label: 'Browser Notifications', description: 'Enable desktop notifications', enabled: false }
  ];

  getUserInitial(): string {
    return this.profile.name ? this.profile.name.charAt(0).toUpperCase() : 'U';
  }

  saveProfile(): void {
    // API call would go here
    this.savedMessage.set('Profile saved successfully');
    setTimeout(() => this.savedMessage.set(''), 3000);
  }

  changePassword(): void {
    if (this.passwords.newPass !== this.passwords.confirm) {
      return;
    }
    // API call would go here
    this.passwords = { current: '', newPass: '', confirm: '' };
  }
}
