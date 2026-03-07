import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { EventTableComponent } from '../../components/event-table/event-table.component';
import { Event, EventFilter } from '../../models/interfaces';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, EventTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Events</h1>
          <p class="text-gray-400 mt-1">Browse and filter all events across projects</p>
        </div>
        <div class="text-sm text-gray-400">
          {{ totalEvents() | number }} total events
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="filter.name"
              (ngModelChange)="onFilterChange()"
              placeholder="Event name..."
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Type</label>
            <select
              [(ngModel)]="filter.type"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              [(ngModel)]="filter.startDate"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              [(ngModel)]="filter.endDate"
              (ngModelChange)="onFilterChange()"
              class="w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              (click)="resetFilters()"
              class="w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Event Table -->
      <app-event-table [events]="events()" />

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-400">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), totalEvents()) }} of {{ totalEvents() }}
          </p>
          <div class="flex items-center gap-2">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            @for (page of getPageNumbers(); track page) {
              <button
                (click)="goToPage(page)"
                class="px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
                [ngClass]="page === currentPage()
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700'"
              >
                {{ page }}
              </button>
            }
            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class EventsComponent implements OnInit {
  private eventService = inject(EventService);

  events = signal<Event[]>([]);
  totalEvents = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  Math = Math;

  filter: EventFilter = {
    type: '',
    name: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  };

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents(this.filter).subscribe({
      next: (response) => {
        this.events.set(response.data);
        this.totalEvents.set(response.total);
        this.totalPages.set(response.totalPages);
      },
      error: () => {
        // Demo data
        const types = ['info', 'error', 'warning', 'success', 'debug'];
        const names = ['page_view', 'user_signup', 'api_error', 'payment_processed', 'session_start', 'button_click', 'form_submit', 'search_query'];
        const events: Event[] = [];
        for (let i = 0; i < 20; i++) {
          events.push({
            id: `evt_${(this.currentPage() - 1) * 20 + i}`,
            projectId: `proj_${Math.floor(Math.random() * 3) + 1}`,
            name: names[Math.floor(Math.random() * names.length)],
            type: types[Math.floor(Math.random() * types.length)],
            payload: { source: 'web', path: '/api/v1/data', status: 200 },
            metadata: {},
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        this.events.set(events);
        this.totalEvents.set(248);
        this.totalPages.set(13);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.filter.page = 1;
    this.loadEvents();
  }

  resetFilters(): void {
    this.filter = { type: '', name: '', startDate: '', endDate: '', page: 1, limit: 20 };
    this.currentPage.set(1);
    this.loadEvents();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.filter.page = page;
    this.loadEvents();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
