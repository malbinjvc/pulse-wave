import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardStats, TimelineDataPoint } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private api: ApiService) {}

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/dashboard/stats');
  }

  getTimeline(projectId?: string, period: string = '24h'): Observable<TimelineDataPoint[]> {
    const params: Record<string, string | number | boolean> = { period };
    if (projectId) params['projectId'] = projectId;
    return this.api.get<TimelineDataPoint[]>('/dashboard/timeline', params);
  }
}
