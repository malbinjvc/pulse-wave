import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Event, EventFilter, PaginatedResponse } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private api: ApiService) {}

  getEvents(filter: EventFilter = {}): Observable<PaginatedResponse<Event>> {
    const params: Record<string, string | number | boolean> = {};
    if (filter.projectId) params['projectId'] = filter.projectId;
    if (filter.type) params['type'] = filter.type;
    if (filter.name) params['name'] = filter.name;
    if (filter.startDate) params['startDate'] = filter.startDate;
    if (filter.endDate) params['endDate'] = filter.endDate;
    if (filter.page) params['page'] = filter.page;
    if (filter.limit) params['limit'] = filter.limit;
    return this.api.get<PaginatedResponse<Event>>('/events', params);
  }

  getEvent(id: string): Observable<Event> {
    return this.api.get<Event>(`/events/${id}`);
  }

  ingestEvent(projectId: string, event: Partial<Event>): Observable<Event> {
    return this.api.post<Event>(`/events/ingest`, { projectId, ...event });
  }

  searchEvents(query: string, projectId?: string): Observable<PaginatedResponse<Event>> {
    const params: Record<string, string | number | boolean> = { q: query };
    if (projectId) params['projectId'] = projectId;
    return this.api.get<PaginatedResponse<Event>>('/events/search', params);
  }

  getRecentEvents(limit: number = 10): Observable<Event[]> {
    return this.api.get<Event[]>('/events/recent', { limit });
  }
}
