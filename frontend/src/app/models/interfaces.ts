export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface Event {
  id: string;
  projectId: string;
  name: string;
  type: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
}

export interface EventFilter {
  projectId?: string;
  type?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalEvents: number;
  eventsToday: number;
  activeProjects: number;
  alertsTriggered: number;
  eventsTrend: number;
  todayTrend: number;
  projectsTrend: number;
  alertsTrend: number;
}

export interface TimelineDataPoint {
  timestamp: string;
  count: number;
}

export interface AlertRule {
  id: string;
  projectId: string;
  name: string;
  condition: string;
  threshold: number;
  window: number;
  channel: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  projectId: string;
  name: string;
  condition: string;
  threshold: number;
  window: number;
  channel: string;
}

export interface AlertHistory {
  id: string;
  alertRuleId: string;
  alertName: string;
  message: string;
  triggeredAt: string;
}

export interface WebSocketMessage {
  type: string;
  data: Event;
}
