import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

describe('DashboardService Integration', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Dashboard API Integration', () => {
    
    it('should call attendance stats endpoint', () => {
      const mockData = {
        percentage: 85.3,
        present: 127,
        absent: 22,
        trend: 'up' as const,
        rate: 85.3
      };

      service.getAttendanceStats().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/attendance-stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call engagement trends endpoint with weeks parameter', () => {
      const weeks = 4;
      const mockData = [
        { week: 'Week 1', value: 85 },
        { week: 'Week 2', value: 78 },
        { week: 'Week 3', value: 92 },
        { week: 'Week 4', value: 88 }
      ];

      service.getEngagementTrends(weeks).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/engagement-trends?weeks=${weeks}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call follow-ups endpoint with priority and limit', () => {
      const priority = 'high';
      const limit = 5;
      const mockData = [
        { id: 1, name: 'John Doe', type: 'New Member' as const, priority: 'high' as const, daysAgo: 2 }
      ];

      service.getFollowUps(priority, limit).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/follow-ups?priority=${priority}&limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call urgent follow-ups endpoint', () => {
      const mockData = [
        { id: 1, name: 'Jane Smith', type: 'Prayer Request' as const, priority: 'high' as const, daysAgo: 1 }
      ];

      service.getUrgentFollowUps().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/follow-ups/urgent`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call upcoming sessions endpoint', () => {
      const limit = 3;
      const mockData = [
        {
          id: '1',
          title: 'Sunday Service',
          date: '2025-08-10T10:00:00Z',
          time: '10:00 AM',
          type: 'service' as const,
          location: 'Main Sanctuary',
          attendeeCount: 200
        }
      ];

      service.getUpcomingsessions(limit).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/sessions/upcoming?limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call workflow stats endpoint', () => {
      const mockData = {
        count: 12,
        lastSync: '2025-08-03T12:00:00Z',
        status: 'active' as const,
        activeWorkflows: 3,
        completedToday: 8,
        pendingActions: 4
      };

      service.getWorkflowStats().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/workflows/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call dashboard summary endpoint', () => {
      const mockData = {
        attendance: { percentage: 85, present: 170, absent: 30, trend: 'up' as const, rate: 85 },
        engagement: [{ week: 'Week 1', value: 85 }],
        followUps: [{ id: 1, name: 'Test', type: 'New Member' as const, priority: 'high' as const, daysAgo: 1 }],
        sessions: {
          stats: { totalToday: 2, upcomingThisWeek: 5, completedThisMonth: 18 },
          upcoming: []
        },
        workflows: {
          count: 5,
          lastSync: '2025-08-03T12:00:00Z',
          status: 'active' as const,
          activeWorkflows: 2,
          completedToday: 3,
          pendingActions: 1
        }
      };

      service.getDashboardSummary().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should call recent activity endpoint', () => {
      const limit = 5;
      const mockData = [
        {
          id: '1',
          type: 'attendance' as const,
          description: 'John marked present',
          timestamp: '2025-08-03T10:00:00Z'
        }
      ];

      service.getRecentActivity(limit).subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/activity?limit=${limit}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle HTTP errors gracefully', () => {
      service.getAttendanceStats().subscribe(data => {
        // Should receive mock data when API fails
        expect(data.percentage).toBeDefined();
        expect(data.present).toBeDefined();
        expect(data.absent).toBeDefined();
        expect(data.trend).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/dashboard/attendance-stats`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});
