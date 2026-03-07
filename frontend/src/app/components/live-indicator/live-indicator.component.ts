import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <span class="relative flex h-3 w-3">
        @if (connected()) {
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        } @else {
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        }
      </span>
      <span class="text-sm font-medium" [ngClass]="connected() ? 'text-green-400' : 'text-red-400'">
        {{ connected() ? 'Live' : 'Disconnected' }}
      </span>
    </div>
  `
})
export class LiveIndicatorComponent {
  connected = input<boolean>(false);
}
