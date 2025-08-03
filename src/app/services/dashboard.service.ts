import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AttendanceStats {
  percentage: number;
  present: number;
  absent: number;
  trend: 'up' | 'down' | 'stable';
  rate?: number;
}

export interface FollowUpItem {
  id: number;
  name: string;
  type: 'New Member' | 'First Time Visitor' | 'Prayer Request' | 'Connection' | 'Pastoral Care' | 'Follow-up';
  priority: 'high' | 'medium' | 'low';
  daysAgo: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string; // API returns dates as strings
  time: string;
  type: 'service' | 'meeting' | 'event' | 'conference';
  location?: string;
  attendeeCount?: number;
}

export interface EngagementData {
  week: string;
  value: number;
}

export interface WorkflowTriggers {
  count: number;
  lastSync: string; // API returns dates as strings
  status: 'active' | 'pending' | 'error';
  activeWorkflows: number;
  completedToday: number;
  pendingActions: number;
}

export interface DashboardSummary {
  attendance: AttendanceStats;
  engagement: EngagementData[];
  followUps: FollowUpItem[];
  sessions: {
    stats: any;
    upcoming: UpcomingEvent[];
  };
  workflows: WorkflowTriggers;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary`).pipe(delay(2000)); // Simulate delay for UI
  }

  getAttendanceStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/dashboard/attendance-stats`).pipe(delay(2000));
  }

  getEngagementTrends(weeks: number = 7): Observable<EngagementData[]> {
    return this.http.get<EngagementData[]>(`${this.apiUrl}/dashboard/engagement-trends?weeks=${weeks}`).pipe(delay(2000));
  }

  getFollowUps(priority?: 'high' | 'medium' | 'low', limit: number = 10): Observable<FollowUpItem[]> {
    const params = priority ? `?priority=${priority}&limit=${limit}` : `?limit=${limit}`;
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups${params}`).pipe(delay(2000));
  }

  getUrgentFollowUps(): Observable<FollowUpItem[]> {
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups/urgent`).pipe(delay(2000));
  }

  getUpcomingsessions(limit: number = 5): Observable<UpcomingEvent[]> {
    return this.http.get<UpcomingEvent[]>(`${this.apiUrl}/dashboard/sessions/upcoming?limit=${limit}`).pipe(delay(2000));
  }

  getWorkflowStats(): Observable<WorkflowTriggers> {
    return this.http.get<WorkflowTriggers>(`${this.apiUrl}/dashboard/workflows/stats`).pipe(delay(2000));
  }
}
