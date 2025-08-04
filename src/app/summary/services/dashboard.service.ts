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
        return of(this.getMockDashboardSummary());
      })
    );
  }

  getAttendanceStats(): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/dashboard/attendance-stats`).pipe(
      catchError(error => {
        console.error('Error fetching attendance stats:', error);
        return of({
          percentage: 85.3,
          present: 127,
          absent: 22,
          trend: 'up' as 'up' | 'down' | 'stable',
          rate: 85.3
        });
      })
    );
  }

  getEngagementTrends(weeks: number = 7): Observable<EngagementData[]> {
    return this.http.get<EngagementData[]>(`${this.apiUrl}/dashboard/engagement-trends?weeks=${weeks}`).pipe(
      catchError(error => {
        console.error('Error fetching engagement trends:', error);
        return of(this.getMockEngagementData(weeks));
      })
    );
  }

  getFollowUps(priority?: 'high' | 'medium' | 'low', limit: number = 10): Observable<FollowUpItem[]> {
    const params = priority ? `?priority=${priority}&limit=${limit}` : `?limit=${limit}`;
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups${params}`).pipe(
      catchError(error => {
        console.error('Error fetching follow-ups:', error);
        return of(this.getMockFollowUps(priority, limit));
      })
    );
  }

  getUrgentFollowUps(): Observable<FollowUpItem[]> {
    return this.http.get<FollowUpItem[]>(`${this.apiUrl}/dashboard/follow-ups/urgent`).pipe(
      catchError(error => {
        console.error('Error fetching urgent follow-ups:', error);
        return of(this.getMockFollowUps('high', 5));
      })
    );
  }

  getUpcomingsessions(limit: number = 5): Observable<UpcomingEvent[]> {
    return this.http.get<UpcomingEvent[]>(`${this.apiUrl}/dashboard/sessions/upcoming?limit=${limit}`).pipe(
      catchError(error => {
        console.error('Error fetching upcoming sessions:', error);
        return of(this.getMockUpcomingEvents(limit));
      })
    );
  }

  getWorkflowStats(): Observable<WorkflowTriggers> {
    return this.http.get<WorkflowTriggers>(`${this.apiUrl}/dashboard/workflows/stats`).pipe(
      catchError(error => {
        console.error('Error fetching workflow stats:', error);
        return of({
          count: 12,
          lastSync: new Date().toISOString(),
          status: 'active' as 'active' | 'pending' | 'error',
          activeWorkflows: 3,
          completedToday: 8,
          pendingActions: 4
        });
      })
    );
  }

  getRecentActivity(limit: number = 10): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/dashboard/activity?limit=${limit}`).pipe(
      catchError(error => {
        console.error('Error fetching recent activity:', error);
        return of(this.getMockRecentActivity(limit));
      })
    );
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard/metrics`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard metrics:', error);
        return of({
          totalMembers: 324,
          growthRate: 12.5,
          avgAttendance: 85,
          newMembers: 8
        });
      })
    );
  }

  // Mock data methods
  private getMockDashboardSummary(): DashboardSummary {
    return {
      attendance: {
        percentage: 85.3,
        present: 127,
        absent: 22,
        trend: 'up' as 'up' | 'down' | 'stable',
        rate: 85.3
      },
      engagement: this.getMockEngagementData(7),
      followUps: this.getMockFollowUps(undefined, 5),
      sessions: {
        stats: {
          totalToday: 2,
          upcomingThisWeek: 5,
          completedThisMonth: 18
        },
        upcoming: this.getMockUpcomingEvents(5)
      },
      workflows: {
        count: 12,
        lastSync: new Date().toISOString(),
        status: 'active' as 'active' | 'pending' | 'error',
        activeWorkflows: 3,
        completedToday: 8,
        pendingActions: 4
      }
    };
  }

  private getMockEngagementData(weeks: number): EngagementData[] {
    const data: EngagementData[] = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      
      data.push({
        week: `Week ${weeks - i}`,
        value: Math.floor(Math.random() * 30) + 70 // Random between 70-100
      });
    }
    
    return data;
  }

  private getMockFollowUps(priority?: 'high' | 'medium' | 'low', limit: number = 10): FollowUpItem[] {
    const allFollowUps: FollowUpItem[] = [
      { id: 1, name: 'Sarah Johnson', type: 'New Member', priority: 'high', daysAgo: 2 },
      { id: 2, name: 'Mike Wilson', type: 'First Time Visitor', priority: 'high', daysAgo: 1 },
      { id: 3, name: 'Lisa Chen', type: 'Prayer Request', priority: 'medium', daysAgo: 3 },
      { id: 4, name: 'David Brown', type: 'Pastoral Care', priority: 'high', daysAgo: 1 },
      { id: 5, name: 'Rachel Green', type: 'Connection', priority: 'medium', daysAgo: 4 },
      { id: 6, name: 'Tom Anderson', type: 'Follow-up', priority: 'low', daysAgo: 5 },
      { id: 7, name: 'Emily Davis', type: 'New Member', priority: 'medium', daysAgo: 2 },
      { id: 8, name: 'John Smith', type: 'Prayer Request', priority: 'high', daysAgo: 1 }
    ];

    let filtered = allFollowUps;
    if (priority) {
      filtered = allFollowUps.filter(f => f.priority === priority);
    }

    return filtered.slice(0, limit);
  }

  private getMockUpcomingEvents(limit: number): UpcomingEvent[] {
    const events: UpcomingEvent[] = [
      {
        id: '1',
        title: 'Sunday Morning Service',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00 AM',
        type: 'service',
        location: 'Main Sanctuary',
        attendeeCount: 250
      },
      {
        id: '2',
        title: 'Youth Group Meeting',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '6:00 PM',
        type: 'meeting',
        location: 'Youth Room',
        attendeeCount: 35
      },
      {
        id: '3',
        title: 'Wednesday Bible Study',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: '7:00 PM',
        type: 'meeting',
        location: 'Fellowship Hall',
        attendeeCount: 45
      },
      {
        id: '4',
        title: 'Community Outreach Event',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        time: '2:00 PM',
        type: 'event',
        location: 'Community Center',
        attendeeCount: 100
      },
      {
        id: '5',
        title: 'Leadership Conference',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '9:00 AM',
        type: 'conference',
        location: 'Conference Room',
        attendeeCount: 25
      }
    ];

    return events.slice(0, limit);
  }

  private getMockRecentActivity(limit: number): RecentActivity[] {
    const activities: RecentActivity[] = [
      {
        id: '1',
        type: 'attendance',
        description: 'John Smith marked present in Sunday Service',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        type: 'followup',
        description: 'New follow-up created for Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '3',
        type: 'workflow',
        description: 'Welcome workflow triggered for 3 new members',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: '4',
        type: 'member',
        description: 'Lisa Chen added as new member',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
      },
      {
        id: '5',
        type: 'attendance',
        description: 'Attendance recorded for Youth Meeting',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];

    return activities.slice(0, limit);
  }
}