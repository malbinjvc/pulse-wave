import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Project, CreateProjectRequest } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private api: ApiService) {}

  getProjects(): Observable<Project[]> {
    return this.api.get<Project[]>('/projects');
  }

  getProject(id: string): Observable<Project> {
    return this.api.get<Project>(`/projects/${id}`);
  }

  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.api.post<Project>('/projects', data);
  }

  updateProject(id: string, data: Partial<CreateProjectRequest>): Observable<Project> {
    return this.api.put<Project>(`/projects/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.api.delete<void>(`/projects/${id}`);
  }

  regenerateApiKey(id: string): Observable<{ apiKey: string }> {
    return this.api.post<{ apiKey: string }>(`/projects/${id}/regenerate-key`);
  }
}
