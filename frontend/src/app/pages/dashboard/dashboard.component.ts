import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { TimelineChartComponent } from '../../components/timeline-chart/timeline-chart.component';
import { EventTableComponent } from '../../components/event-table/event-table.component';
import { DashboardService } from '../../services/dashboard.service';
import { EventService } from '../../services/event.service';
import { DashboardStats, TimelineDataPoint, Event } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatsCardComponent, TimelineChartComponent, EventTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white">Dashboard</h1>
          <p class="text-gray-400 mt-1">Overview of your event analytics</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-400">Last updated:</span>
          <span class="text-sm text-gray-300">{{ lastUpdated() }}</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <app-stats-card
          label="Total Events"
          [value]="stats().totalEvents"
          [trend]="stats().eventsTrend"
          iconBgClass="bg-indigo-500/20"
          icon='<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
        />
        <app-stats-card
          label="Events Today"
          [value]="stats().eventsToday"
          [trend]="stats().todayTrend"
          iconBgClass="bg-green-500/20"
          icon='<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>'
        />
        <app-stats-card
          label="Active Projects"
          [value]="stats().activeProjects"
          [trend]="stats().projectsTrend"
          iconBgClass="bg-blue-500/20"
          icon='<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>'
        />
        <app-stats-card
          label="Alerts Triggered"
          [value]="stats().alertsTriggered"
          [trend]="stats().alertsTrend"
          iconBgClass="bg-red-500/20"
          icon='<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
        />
      </div>

      <!-- Timeline Chart -->
      <app-timeline-chart
        title="Event Timeline"
        [data]="timelineData()"
      />

      <!-- Recent Events -->
      <app-event-table
        title="Recent Events"
        [events]="recentEvents()"
        [showViewAll]="true"
        (viewAll)="navigateToEvents()"
      />
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private eventService = inject(EventService);
  private router = inject(Router);

  stats = signal<DashboardStats>({
    totalEvents: 0,
    eventsToday: 0,
    activeProjects: 0,
    alertsTriggered: 0,
    eventsTrend: 0,
    todayTrend: 0,
    projectsTrend: 0,
    alertsTrend: 0
  });

  timelineData = signal<TimelineDataPoint[]>([]);
  recentEvents = signal<Event[]>([]);
  lastUpdated = signal<string>('');

  ngOnInit(): void {
    this.loadDashboard();
    this.updateLastUpdated();
  }

  loadDashboard(): void {
    this.dashboardService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {
        // Use demo data on error
        this.stats.set({
          totalEvents: 124853,
          eventsToday: 3847,
          activeProjects: 12,
          alertsTriggered: 7,
          eventsTrend: 12.5,
          todayTrend: 8.2,
          projectsTrend: 2,
          alertsTrend: -15
        });
      }
    });

    this.dashboardService.getTimeline().subscribe({
      next: (data) => this.timelineData.set(data),
      error: () => {
        // Generate demo timeline data
        const now = Date.now();
        const points: TimelineDataPoint[] = [];
        for (let i = 23; i >= 0; i--) {
          points.push({
            timestamp: new Date(now - i * 3600000).toISOString(),
            count: Math.floor(Math.random() * 200) + 50
          });
        }
        this.timelineData.set(points);
      }
    });

    this.eventService.getRecentEvents(10).subscribe({
      next: (events) => this.recentEvents.set(events),
      error: () => {
        // Generate demo events
        const types = ['info', 'error', 'warning', 'success', 'debug'];
        const names = ['page_view', 'user_signup', 'api_error', 'payment_processed', 'session_start', 'button_click'];
        const events: Event[] = [];
        for (let i = 0; i < 10; i++) {
          events.push({
            id: `evt_${i}`,
            projectId: `proj_${Math.floor(Math.random() * 3)}`,
            name: names[Math.floor(Math.random() * names.length)],
            type: types[Math.floor(Math.random() * types.length)],
            payload: { source: 'web', path: '/dashboard' },
            metadata: {},
            timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        this.recentEvents.set(events);
      }
    });
  }

  navigateToEvents(): void {
    this.router.navigate(['/events']);
  }

  private updateLastUpdated(): void {
    const now = new Date();
    this.lastUpdated.set(now.toLocaleTimeString());
  }
}
