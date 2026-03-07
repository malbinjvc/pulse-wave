import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/interfaces';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Projects</h1>
          <p class="text-gray-400 mt-1">Manage your event tracking projects</p>
        </div>
        <button
          (click)="showCreateDialog.set(true)"
          class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Project
        </button>
      </div>

      <!-- Project Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (project of projects(); track project.id) {
          <div
            class="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors cursor-pointer group"
            (click)="openProject(project.id)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
              <button
                (click)="deleteProject(project.id, $event)"
                class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            <h3 class="text-lg font-semibold text-white mb-1">{{ project.name }}</h3>
            <p class="text-sm text-gray-400 mb-4 line-clamp-2">{{ project.description }}</p>

            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span class="text-sm text-gray-300">{{ project.eventCount | number }} events</span>
              </div>
              <span class="text-xs text-gray-500">{{ formatDate(project.createdAt) }}</span>
            </div>

            <!-- API Key -->
            <div class="bg-gray-900/50 rounded-lg p-3" (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-500 font-medium">API Key</span>
                <button
                  (click)="copyApiKey(project.apiKey)"
                  class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {{ copiedKey() === project.apiKey ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <code class="text-xs text-gray-400 font-mono break-all">{{ maskApiKey(project.apiKey) }}</code>
            </div>
          </div>
        } @empty {
          <div class="col-span-full flex flex-col items-center justify-center py-16">
            <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <h3 class="text-lg font-medium text-gray-400 mb-2">No projects yet</h3>
            <p class="text-sm text-gray-500 mb-4">Create your first project to start tracking events</p>
            <button
              (click)="showCreateDialog.set(true)"
              class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Create Project
            </button>
          </div>
        }
      </div>

      <!-- Create Dialog -->
      @if (showCreateDialog()) {
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div class="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg">
            <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white">Create New Project</h3>
              <button (click)="showCreateDialog.set(false)" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                <input
                  type="text"
                  [(ngModel)]="newProject.name"
                  placeholder="My Awesome Project"
                  class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  [(ngModel)]="newProject.description"
                  rows="3"
                  placeholder="Describe your project..."
                  class="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 resize-none"
                ></textarea>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                (click)="showCreateDialog.set(false)"
                class="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                (click)="createProject()"
                [disabled]="!newProject.name"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  showCreateDialog = signal(false);
  copiedKey = signal('');
  newProject = { name: '', description: '' };

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {
        // Demo data
        this.projects.set([
          {
            id: 'proj_1',
            name: 'Web Application',
            description: 'Main web application event tracking',
            apiKey: 'pw_live_a1b2c3d4e5f6g7h8i9j0',
            eventCount: 45230,
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'proj_2',
            name: 'Mobile API',
            description: 'Mobile backend API event monitoring',
            apiKey: 'pw_live_k1l2m3n4o5p6q7r8s9t0',
            eventCount: 28150,
            createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'proj_3',
            name: 'Payment Service',
            description: 'Payment processing event pipeline',
            apiKey: 'pw_live_u1v2w3x4y5z6a7b8c9d0',
            eventCount: 12890,
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  openProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  createProject(): void {
    if (!this.newProject.name) return;
    this.projectService.createProject(this.newProject).subscribe({
      next: (project) => {
        this.projects.update(list => [...list, project]);
        this.showCreateDialog.set(false);
        this.newProject = { name: '', description: '' };
      },
      error: () => {
        this.showCreateDialog.set(false);
        this.newProject = { name: '', description: '' };
      }
    });
  }

  deleteProject(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => this.projects.update(list => list.filter(p => p.id !== id)),
        error: () => this.projects.update(list => list.filter(p => p.id !== id))
      });
    }
  }

  copyApiKey(key: string): void {
    navigator.clipboard.writeText(key);
    this.copiedKey.set(key);
    setTimeout(() => this.copiedKey.set(''), 2000);
  }

  maskApiKey(key: string): string {
    if (key.length <= 12) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
