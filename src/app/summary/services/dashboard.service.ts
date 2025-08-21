import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AttendanceStats,
  FollowUpItem,
  UpcomingEvent,
  EngagementData,
  WorkflowTriggers,
  SessionStats,
  DashboardSummary,
  RecentActivity,
  DashboardMetrics
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard summary:', error);
        // Return empty data structure instead of mock
        return of({
          attendance: {
            percentage: 0,
            present: 0,
            absent: 0,
            trend: 'stable' as 'up' | 'down' | 'stable',
            rate: 0
          },
          engagement: [],
          followUps: [],
          sessions: {
            stats: {
              totalToday: 0,
              upcomingThisWeek: 0,
              completedThisMonth: 0
            },
            upcoming: []
          },
          workflows: {
            count: 0,
            lastSync: new Date().toISOString(),
            status: 'pending' as 'active' | 'pending' | 'error',
            activeWorkflows: 0,
            completedToday: 0,
            pendingActions: 0
          }
        });
      })
    );
  }

  getAttendanceStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/dashboard/attendance-stats`).pipe(
      catchError(error => {
        console.error('Error fetching attendance stats:', error);
        return of({
          percentage: 0,
          present: 0,
          absent: 0,
          trend: 'stable' as 'up' | 'down' | 'stable',
          rate: 0
        });
      })
    );
  }

  getEngagementTrends(weeks: number = 7): Observable<EngagementData[]> {
    return this.http.get<EngagementData[]>(`${this.apiUrl}/dashboard/engagement-trends?weeks=${weeks}`).pipe(
      catchError(error => {
        console.error('Error fetching engagement trends:', error);
        return of([]);
      })
    );
  }

  getFollowUps(priority?: 'high' | 'medium' | 'low', limit: number = 10): Observable<FollowUpItem[]> {
    const params = priority ? `?priority=${priority}&limit=${limit}` : `?limit=${limit}`;
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups${params}`).pipe(
      catchError(error => {
        console.error('Error fetching follow-ups:', error);
        return of([]);
      })
    );
  }

  getUrgentFollowUps(): Observable<FollowUpItem[]> {
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups/urgent`).pipe(
      catchError(error => {
        console.error('Error fetching urgent follow-ups:', error);
        return of([]);
      })
    );
  }

  getUpcomingsessions(limit: number = 5): Observable<UpcomingEvent[]> {
    return this.http.get<UpcomingEvent[]>(`${this.apiUrl}/dashboard/sessions/upcoming?limit=${limit}`).pipe(
      catchError(error => {
        console.error('Error fetching upcoming sessions:', error);
        return of([]);
      })
    );
  }

  getWorkflowStats(): Observable<WorkflowTriggers> {
    return this.http.get<WorkflowTriggers>(`${this.apiUrl}/dashboard/workflows/stats`).pipe(
      catchError(error => {
        console.error('Error fetching workflow stats:', error);
        return of({
          count: 0,
          lastSync: new Date().toISOString(),
          status: 'pending' as 'active' | 'pending' | 'error',
          activeWorkflows: 0,
          completedToday: 0,
          pendingActions: 0
        });
      })
    );
  }

  getRecentActivity(limit: number = 10): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/dashboard/activity?limit=${limit}`).pipe(
      catchError(error => {
        console.error('Error fetching recent activity:', error);
        return of([]);
      })
    );
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard/metrics`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard metrics:', error);
        return of({
          totalMembers: 0,
          growthRate: 0,
          avgAttendance: 0,
          newMembers: 0
        });
      })
    );
  }
}