import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AlertRule, CreateAlertRequest, AlertHistory } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(private api: ApiService) {}

  getAlertRules(): Observable<AlertRule[]> {
    return this.api.get<AlertRule[]>('/alerts/rules');
  }

  getAlertRule(id: string): Observable<AlertRule> {
    return this.api.get<AlertRule>(`/alerts/rules/${id}`);
  }

  createAlertRule(data: CreateAlertRequest): Observable<AlertRule> {
    return this.api.post<AlertRule>('/alerts/rules', data);
  }

  updateAlertRule(id: string, data: Partial<CreateAlertRequest>): Observable<AlertRule> {
    return this.api.put<AlertRule>(`/alerts/rules/${id}`, data);
  }

  deleteAlertRule(id: string): Observable<void> {
    return this.api.delete<void>(`/alerts/rules/${id}`);
  }

  toggleAlertRule(id: string, enabled: boolean): Observable<AlertRule> {
    return this.api.put<AlertRule>(`/alerts/rules/${id}`, { enabled });
  }

  getAlertHistory(): Observable<AlertHistory[]> {
    return this.api.get<AlertHistory[]>('/alerts/history');
  }
}
