import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';
import { ProjectService } from '../../services/project.service';
import { AlertFormComponent } from '../../components/alert-form/alert-form.component';
import { AlertRule, AlertHistory, CreateAlertRequest, Project } from '../../models/interfaces';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, AlertFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Alerts</h1>
          <p class="text-gray-400 mt-1">Manage alert rules and view alert history</p>
        </div>
        <button
          (click)="showForm.set(true)"
          class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Alert Rule
        </button>
      </div>

      <!-- Alert Rules -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Alert Rules</h3>
        </div>
        <div class="divide-y divide-gray-700/50">
          @for (rule of alertRules(); track rule.id) {
            <div class="px-6 py-4 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  [ngClass]="rule.enabled ? 'bg-green-500/20' : 'bg-gray-700'"
                >
                  <svg
                    class="w-5 h-5"
                    [class.text-green-400]="rule.enabled"
                    [class.text-gray-500]="!rule.enabled"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-white">{{ rule.name }}</h4>
                  <p class="text-xs text-gray-400">
                    {{ getConditionLabel(rule.condition) }} {{ rule.threshold }} in {{ rule.window }}min
                    <span class="text-gray-600 mx-1">|</span>
                    {{ rule.channel }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  (click)="toggleRule(rule)"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  [class.bg-indigo-600]="rule.enabled"
                  [class.bg-gray-600]="!rule.enabled"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    [class.translate-x-6]="rule.enabled"
                    [class.translate-x-1]="!rule.enabled"
                  ></span>
                </button>
                <button
                  (click)="editRule(rule)"
                  class="text-gray-400 hover:text-white p-1 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  (click)="deleteRule(rule.id)"
                  class="text-gray-400 hover:text-red-400 p-1 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="px-6 py-12 text-center">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p class="text-sm text-gray-500">No alert rules configured</p>
            </div>
          }
        </div>
      </div>

      <!-- Alert History -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Alert History</h3>
        </div>
        <div class="divide-y divide-gray-700/50">
          @for (alert of alertHistory(); track alert.id) {
            <div class="px-6 py-4 flex items-center gap-4 hover:bg-gray-700/20 transition-colors">
              <div class="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-white">{{ alert.alertName }}</h4>
                <p class="text-xs text-gray-400 truncate">{{ alert.message }}</p>
              </div>
              <span class="text-xs text-gray-500 whitespace-nowrap">{{ formatTime(alert.triggeredAt) }}</span>
            </div>
          } @empty {
            <div class="px-6 py-12 text-center">
              <p class="text-sm text-gray-500">No alerts triggered yet</p>
            </div>
          }
        </div>
      </div>

      <!-- Alert Form Modal -->
      @if (showForm()) {
        <app-alert-form
          [editRule]="editingRule()"
          [projects]="projects()"
          (cancel)="closeForm()"
          (save)="saveRule($event)"
        />
      }
    </div>
  `
})
export class AlertsComponent implements OnInit {
  private alertService = inject(AlertService);
  private projectService = inject(ProjectService);

  alertRules = signal<AlertRule[]>([]);
  alertHistory = signal<AlertHistory[]>([]);
  projects = signal<Project[]>([]);
  showForm = signal(false);
  editingRule = signal<AlertRule | null>(null);

  ngOnInit(): void {
    this.loadAlertRules();
    this.loadAlertHistory();
    this.loadProjects();
  }

  loadAlertRules(): void {
    this.alertService.getAlertRules().subscribe({
      next: (rules) => this.alertRules.set(rules),
      error: () => {
        this.alertRules.set([
          {
            id: 'alert_1', projectId: 'proj_1', name: 'High Error Rate',
            condition: 'error_rate', threshold: 50, window: 5, channel: 'email',
            enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          },
          {
            id: 'alert_2', projectId: 'proj_2', name: 'Event Spike',
            condition: 'count_exceeds', threshold: 1000, window: 10, channel: 'slack',
            enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          },
          {
            id: 'alert_3', projectId: 'proj_1', name: 'Service Down',
            condition: 'no_events', threshold: 0, window: 15, channel: 'webhook',
            enabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  loadAlertHistory(): void {
    this.alertService.getAlertHistory().subscribe({
      next: (history) => this.alertHistory.set(history),
      error: () => {
        this.alertHistory.set([
          {
            id: 'ah_1', alertRuleId: 'alert_1', alertName: 'High Error Rate',
            message: 'Error rate exceeded 50 in the last 5 minutes (current: 73)',
            triggeredAt: new Date(Date.now() - 1800000).toISOString()
          },
          {
            id: 'ah_2', alertRuleId: 'alert_2', alertName: 'Event Spike',
            message: 'Event count exceeded 1000 in the last 10 minutes (current: 1247)',
            triggeredAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'ah_3', alertRuleId: 'alert_1', alertName: 'High Error Rate',
            message: 'Error rate exceeded 50 in the last 5 minutes (current: 68)',
            triggeredAt: new Date(Date.now() - 14400000).toISOString()
          }
        ]);
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {
        this.projects.set([
          { id: 'proj_1', name: 'Web Application', description: '', apiKey: '', eventCount: 0, createdAt: '', updatedAt: '' },
          { id: 'proj_2', name: 'Mobile API', description: '', apiKey: '', eventCount: 0, createdAt: '', updatedAt: '' }
        ]);
      }
    });
  }

  toggleRule(rule: AlertRule): void {
    const newEnabled = !rule.enabled;
    this.alertService.toggleAlertRule(rule.id, newEnabled).subscribe({
      next: () => {
        this.alertRules.update(rules =>
          rules.map(r => r.id === rule.id ? { ...r, enabled: newEnabled } : r)
        );
      },
      error: () => {
        this.alertRules.update(rules =>
          rules.map(r => r.id === rule.id ? { ...r, enabled: newEnabled } : r)
        );
      }
    });
  }

  editRule(rule: AlertRule): void {
    this.editingRule.set(rule);
    this.showForm.set(true);
  }

  deleteRule(id: string): void {
    if (confirm('Are you sure you want to delete this alert rule?')) {
      this.alertService.deleteAlertRule(id).subscribe({
        next: () => this.alertRules.update(rules => rules.filter(r => r.id !== id)),
        error: () => this.alertRules.update(rules => rules.filter(r => r.id !== id))
      });
    }
  }

  saveRule(data: CreateAlertRequest): void {
    const editing = this.editingRule();
    if (editing) {
      this.alertService.updateAlertRule(editing.id, data).subscribe({
        next: (updated) => {
          this.alertRules.update(rules => rules.map(r => r.id === editing.id ? updated : r));
          this.closeForm();
        },
        error: () => this.closeForm()
      });
    } else {
      this.alertService.createAlertRule(data).subscribe({
        next: (rule) => {
          this.alertRules.update(rules => [...rules, rule]);
          this.closeForm();
        },
        error: () => this.closeForm()
      });
    }
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingRule.set(null);
  }

  getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
      'count_exceeds': 'Event count >',
      'error_rate': 'Error rate >',
      'no_events': 'No events for'
    };
    return labels[condition] || condition;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
}
