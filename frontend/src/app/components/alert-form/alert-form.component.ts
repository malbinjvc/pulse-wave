import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertRule, CreateAlertRequest, Project } from '../../models/interfaces';

@Component({
  selector: 'app-alert-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">
            {{ editRule() ? 'Edit Alert Rule' : 'Create Alert Rule' }}
          </h3>
          <button (click)="cancel.emit()" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              [(ngModel)]="formData.name"
              placeholder="e.g., High Error Rate"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Project</label>
            <select
              [(ngModel)]="formData.projectId"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="" disabled>Select a project</option>
              @for (project of projects(); track project.id) {
                <option [value]="project.id">{{ project.name }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Condition</label>
            <select
              [(ngModel)]="formData.condition"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="count_exceeds">Event count exceeds</option>
              <option value="error_rate">Error rate exceeds</option>
              <option value="no_events">No events received</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Threshold</label>
              <input
                type="number"
                [(ngModel)]="formData.threshold"
                placeholder="100"
                class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Window (minutes)</label>
              <input
                type="number"
                [(ngModel)]="formData.window"
                placeholder="5"
                class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Notification Channel</label>
            <select
              [(ngModel)]="formData.channel"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            (click)="cancel.emit()"
            class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            (click)="submitForm()"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            {{ editRule() ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AlertFormComponent {
  editRule = input<AlertRule | null>(null);
  projects = input<Project[]>([]);
  cancel = output<void>();
  save = output<CreateAlertRequest>();

  formData: CreateAlertRequest = {
    projectId: '',
    name: '',
    condition: 'count_exceeds',
    threshold: 100,
    window: 5,
    channel: 'email'
  };

  constructor() {
    // Check for edit rule after inputs are set
    setTimeout(() => {
      const rule = this.editRule();
      if (rule) {
        this.formData = {
          projectId: rule.projectId,
          name: rule.name,
          condition: rule.condition,
          threshold: rule.threshold,
          window: rule.window,
          channel: rule.channel
        };
      }
    });
  }

  submitForm(): void {
    if (this.formData.name && this.formData.projectId) {
      this.save.emit({ ...this.formData });
    }
  }
}
