import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../models/interfaces';

@Component({
  selector: 'app-event-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      @if (title()) {
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">{{ title() }}</h3>
          @if (showViewAll()) {
            <button
              (click)="viewAll.emit()"
              class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </button>
          }
        </div>
      }
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Project</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Payload</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50">
            @for (event of events(); track event.id) {
              <tr class="hover:bg-gray-700/30 transition-colors cursor-pointer" (click)="eventClick.emit(event)">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" [ngClass]="getTypeColor(event.type)"></div>
                    <span class="text-sm font-medium text-white">{{ event.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                        [ngClass]="getTypeBadge(event.type)">
                    {{ event.type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">{{ event.projectId }}</td>
                <td class="px-6 py-4 text-sm text-gray-400 hidden lg:table-cell max-w-xs truncate">
                  {{ event.payload | json }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{{ formatTime(event.timestamp) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                  </svg>
                  <p class="text-sm">No events found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class EventTableComponent {
  events = input<Event[]>([]);
  title = input<string>('');
  showViewAll = input<boolean>(false);
  viewAll = output<void>();
  eventClick = output<Event>();

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'error': 'bg-red-500',
      'warning': 'bg-yellow-500',
      'info': 'bg-blue-500',
      'success': 'bg-green-500',
      'debug': 'bg-gray-500'
    };
    return colors[type.toLowerCase()] || 'bg-indigo-500';
  }

  getTypeBadge(type: string): string {
    const badges: Record<string, string> = {
      'error': 'bg-red-900/50 text-red-400',
      'warning': 'bg-yellow-900/50 text-yellow-400',
      'info': 'bg-blue-900/50 text-blue-400',
      'success': 'bg-green-900/50 text-green-400',
      'debug': 'bg-gray-700 text-gray-400'
    };
    return badges[type.toLowerCase()] || 'bg-indigo-900/50 text-indigo-400';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
}
