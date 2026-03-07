import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div class="flex items-center justify-between mb-4">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          [ngClass]="iconBgClass()"
        >
          <span [innerHTML]="icon()" class="w-5 h-5"></span>
        </div>
        @if (trend() !== 0) {
          <span
            class="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
            [ngClass]="trend() > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'"
          >
            @if (trend() > 0) {
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
            } @else {
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
              </svg>
            }
            {{ trend() > 0 ? '+' : '' }}{{ trend() }}%
          </span>
        }
      </div>
      <h3 class="text-2xl font-bold text-white">{{ formattedValue() }}</h3>
      <p class="text-sm text-gray-400 mt-1">{{ label() }}</p>
    </div>
  `
})
export class StatsCardComponent {
  label = input.required<string>();
  value = input.required<number>();
  icon = input<string>('');
  iconBgClass = input<string>('bg-indigo-500/20');
  trend = input<number>(0);

  formattedValue(): string {
    const v = this.value();
    if (v >= 1000000) {
      return (v / 1000000).toFixed(1) + 'M';
    } else if (v >= 1000) {
      return (v / 1000).toFixed(1) + 'K';
    }
    return v.toString();
  }
}
