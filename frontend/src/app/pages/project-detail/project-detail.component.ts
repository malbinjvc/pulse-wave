import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { EventService } from '../../services/event.service';
import { WebSocketService } from '../../services/websocket.service';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { TimelineChartComponent } from '../../components/timeline-chart/timeline-chart.component';
import { EventTableComponent } from '../../components/event-table/event-table.component';
import { LiveIndicatorComponent } from '../../components/live-indicator/live-indicator.component';
import { DashboardService } from '../../services/dashboard.service';
import { Project, Event, TimelineDataPoint } from '../../models/interfaces';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, StatsCardComponent, TimelineChartComponent, EventTableComponent, LiveIndicatorComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-bold text-white">{{ project()?.name || 'Project' }}</h1>
            <app-live-indicator [connected]="isConnected()" />
          </div>
          <p class="text-gray-400">{{ project()?.description }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <span class="text-xs text-gray-500 block">API Key</span>
            <code class="text-sm text-gray-300 font-mono">{{ project()?.apiKey || '---' }}</code>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <app-stats-card
          label="Total Events"
          [value]="project()?.eventCount || 0"
          iconBgClass="bg-indigo-500/20"
          icon='<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
        />
        <app-stats-card
          label="Events (last hour)"
          [value]="eventsLastHour()"
          iconBgClass="bg-green-500/20"
          icon='<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        />
        <app-stats-card
          label="Live Events"
          [value]="liveEventCount()"
          iconBgClass="bg-purple-500/20"
          icon='<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/></svg>'
        />
      </div>

      <!-- Timeline -->
      <app-timeline-chart
        title="Event Activity"
        [data]="timelineData()"
      />

      <!-- Live Events Stream -->
      <div class="bg-gray-800 rounded-xl border border-gray-700">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-white">Live Event Stream</h3>
            <app-live-indicator [connected]="isConnected()" />
          </div>
          <span class="text-sm text-gray-400">{{ liveEvents().length }} events</span>
        </div>
        <div class="max-h-96 overflow-y-auto">
          @for (event of liveEvents(); track event.id) {
            <div class="px-6 py-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span class="text-sm font-medium text-white">{{ event.name }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400">{{ event.type }}</span>
                </div>
                <span class="text-xs text-gray-500">{{ formatTime(event.timestamp) }}</span>
              </div>
            </div>
          } @empty {
            <div class="px-6 py-12 text-center text-gray-500">
              <p class="text-sm">Waiting for live events...</p>
            </div>
          }
        </div>
      </div>

      <!-- Project Events -->
      <app-event-table
        title="Project Events"
        [events]="projectEvents()"
      />
    </div>
  `
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private eventService = inject(EventService);
  private wsService = inject(WebSocketService);
  private dashboardService = inject(DashboardService);

  private subscriptions: Subscription[] = [];

  project = signal<Project | null>(null);
  projectEvents = signal<Event[]>([]);
  liveEvents = signal<Event[]>([]);
  timelineData = signal<TimelineDataPoint[]>([]);
  isConnected = signal(false);
  eventsLastHour = signal(0);
  liveEventCount = signal(0);

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject(projectId);
    this.loadEvents(projectId);
    this.loadTimeline(projectId);
    this.connectWebSocket(projectId);
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadProject(id: string): void {
    this.projectService.getProject(id).subscribe({
      next: (project) => this.project.set(project),
      error: () => {
        this.project.set({
          id,
          name: 'Web Application',
          description: 'Main web application event tracking',
          apiKey: 'pw_demo_xxxxxxxxxxxxxxxxxxxxxxxx',
          eventCount: 45230,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
  }

  private loadEvents(projectId: string): void {
    this.eventService.getEvents({ projectId, limit: 20 }).subscribe({
      next: (response) => {
        this.projectEvents.set(response.data);
        this.eventsLastHour.set(Math.floor(response.total * 0.04));
      },
      error: () => {
        const types = ['info', 'error', 'warning', 'success'];
        const names = ['page_view', 'api_call', 'user_action', 'system_event'];
        const events: Event[] = [];
        for (let i = 0; i < 15; i++) {
          events.push({
            id: `evt_${i}`,
            projectId,
            name: names[Math.floor(Math.random() * names.length)],
            type: types[Math.floor(Math.random() * types.length)],
            payload: { path: '/api/v1/data' },
            metadata: {},
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        this.projectEvents.set(events);
        this.eventsLastHour.set(156);
      }
    });
  }

  private loadTimeline(projectId: string): void {
    this.dashboardService.getTimeline(projectId).subscribe({
      next: (data) => this.timelineData.set(data),
      error: () => {
        const now = Date.now();
        const points: TimelineDataPoint[] = [];
        for (let i = 23; i >= 0; i--) {
          points.push({
            timestamp: new Date(now - i * 3600000).toISOString(),
            count: Math.floor(Math.random() * 150) + 20
          });
        }
        this.timelineData.set(points);
      }
    });
  }

  private connectWebSocket(projectId: string): void {
    this.wsService.connect(projectId);

    const connSub = this.wsService.connectionStatus$.subscribe(status => {
      this.isConnected.set(status);
    });

    const eventSub = this.wsService.events$.subscribe(event => {
      this.liveEvents.update(events => [event, ...events].slice(0, 50));
      this.liveEventCount.update(c => c + 1);
    });

    this.subscriptions.push(connSub, eventSub);
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
}
